module.exports = function (logger) {
    let invoke_chaincode = {};

    let util = require('util');
    let helper = require('./helper')(logger);

    options = {
        peerName: ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName: 'fzuchannel',
        chaincodeName: 'mycc',
        functionName: '',
        args: '',
        userName: 'User1',
        orgName: 'Org1'
    };

    /**
     * 调用链码,利用传入的链码函数名functionName,添加参数args完成链码调用,并返回结果
     * @param peerName
     * @param channelName
     * @param chaincodeName
     * @param functionName
     * @param args
     * @param userName
     * @param orgName
     * @returns {Promise<void>}
     */
    invoke_chaincode.invokeChaincode = async function (peerName, channelName, chaincodeName,
                                                       functionName, args, userName, orgName) {
        let error_message = null;
        let tx_id_string = null;
        let eventhubs_in_use = [];

        try{
            //获取当前client
            let fabric_client = await helper.getClientForOrg(orgName, userName);
            //获取当前channel
            let channel = fabric_client.getChannel(channelName);
            if(!channel){
                let message = util.format('[FzuChain] Channel %s was not defined in connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }
            //获取交易id,获取基于admin的transactionID
            let tx_id = fabric_client.newTransactionID();
            tx_id_string = tx_id.getTransactionID();

            //构建提案请求request
            let proposalRequest = {
                targets: peerName,
                chaincodeId: chaincodeName,
                fcn: functionName,
                args: args,
                chainId: channelName,
                txId: tx_id
            };

            let results = await channel.sendTransactionProposal(proposalRequest);

            //得到返回的交易提案和提案响应
            let proposal = results[1];
            let proposalResponses = results[0];
            // let invokeResult = byteToString(proposalResponses[0].payload);
            // logger.info(invokeResult);
            logger.info(proposalResponses[0].payload);

            //检查提案响应是否都正确
            let all_good = true;
            for(let i in proposalResponses){
                let one_good = false;
                if(proposalResponses && proposalResponses[i].response &&
                    proposalResponses[i].response.status === 200){
                    one_good = true;
                    logger.info('[FzuChain] invoke chaincode proposal was good');
                }else{
                    logger.error('[FzuChain] invoke chaincode proposal was bad');
                }
                all_good = all_good & one_good;
            }

            //如果提案响应全部成功,再注册就交易监听
            if(all_good){
                //打印提案响应数据
                logger.info(util.format(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                    proposalResponses[0].response.status, proposalResponses[0].response.message,
                    proposalResponses[0].response.payload, proposalResponses[0].endorsement
                        .signature));

                let promises = [];
                let event_hubs = fabric_client.getEventHubsForOrg(orgName);

                event_hubs.forEach((eventHubs)=>{
                    let invokeEventPromise = new Promise((resolve, reject)=>{
                        let event_timeout = setTimeout(() => {
                            let message = 'REQUEST_TIMEOUT:' + eventHubs.getPeerAddr();
                            logger.info('[FzuChain]: '+message);
                            eventHubs.disconnect();
                            reject(new Error(message));
                        }, 3000);

                        // 注册交易事件监听，当交易被peer提交到账本中时可以得到反馈
                        eventHubs.registerTxEvent(tx_id_string, (tx, code)=>{
                            //监听接收每个peer的响应消息
                            logger.info('[FzuChain] The chaincode invoke chaincode transaction has been committed on peer %s',eventHubs._ep._endpoint.addr);
                            clearTimeout(event_timeout);
                            eventHubs.unregisterTxEvent(tx_id_string);

                            if(code !== 'VALID'){
                                let message = util.format('[FzuChain] The invoke chaincode transaction was invalid, code:%s',code);
                                logger.error(message);
                                reject(new Error(message));
                            }else {
                                let message = '[FzuChain] The invoke chaincode transaction was valid.';
                                logger.info(message);
                                resolve(message);
                            }
                        },(err) => {
                            clearTimeout(event_timeout);
                            eventHubs.unregisterTxEvent(tx_id_string);
                            let message = '[FzuChain] Problem setting up the event hub :'+ err.toString();
                            logger.error(message);
                            reject(new Error(message));
                        });
                    });
                    promises.push(invokeEventPromise);
                    eventHubs.connect();
                    eventhubs_in_use.push(eventHubs);
                });

                // 将txID，交易提案和提案响应打包成交易请求
                let orderRequest = {
                    txID: tx_id,
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };
                //将交易请求发给orderer节点进行排序,并同步到各个记账节点
                let sendPromise = channel.sendTransaction(orderRequest);
                promises.push(sendPromise);
                let results = await Promise.all(promises);
                logger.debug(util.format('------->>> R E S P O N S E : %j', results));
                //order的result是最终的result
                let response = results.pop();
                //查看response状态
                if (response.status === 'SUCCESS') {
                    logger.info('[FzuChain] Successfully sent transaction to the orderer.');
                } else {
                    error_message = util.format('[FzuChain] Failed to order the transaction. Error code: %s',response.status);
                    logger.debug(error_message);
                }
                //输出在event hub监听中出现的节点地址
                for(let i in results) {
                    let event_hub_result = results[i];
                    let event_hub = event_hubs[i];
                    logger.debug('[FzuChain] Event results for event hub :%s',event_hub._ep._endpoint.addr);
                    if(typeof event_hub_result === 'string') {
                        logger.debug(event_hub_result);
                    } else {
                        if(!error_message) error_message = event_hub_result.toString();
                        logger.debug(event_hub_result.toString());
                    }
                }

            }else{
                error_message = util.format('[FzuChain] Failed to send Proposal and receive all good proposalResponses');
                logger.debug(error_message);
            }
        }catch (error) {
            logger.error('[FzuChain] Failed to invoke due to error'+error.stack ? error.stack: error);
            error_message = error.toString();
        }

        //断开连接的事件流
        eventhubs_in_use.forEach((eventHubs)=>{
            eventHubs.disconnect();
        });

        if(!error_message){
            let message = util.format(
                '[FzuChain] Successfully invoked the chaincode %s to the channel \'%s\'',
                orgName, channelName);
            logger.info(message);
            return tx_id_string;
        }else{
            let message = util.format('[FzuChain] Failed to invoke chaincode, cause: %s', error_message);
            logger.error(message);
            throw new Error(message);
        }
    };


    function byteToString(arr) {
        if(typeof arr === 'string') {
            return arr;
        }
        let str = '',
            _arr = arr;
        for(let i = 0; i < _arr.length; i++) {
            let one = _arr[i].toString(2),
                v = one.match(/^1+?(?=0)/);
            if(v && one.length == 8) {
                let bytesLength = v[0].length;
                let store = _arr[i].toString(2).slice(7 - bytesLength);
                for(let st = 1; st < bytesLength; st++) {
                    store += _arr[st + i].toString(2).slice(2);
                }
                str += String.fromCharCode(parseInt(store, 2));
                i += bytesLength - 1;
            } else {
                str += String.fromCharCode(_arr[i]);
            }
        }
        return str;
    }

    return invoke_chaincode;
};