module.exports = function(logger){
    let join_channel = {};

    let fs = require('fs');
    let path = require('path');
    let helper = require('./helper')(logger);
    let util = require('util');

    //加入到知道指定channel参数
    options = {
        channelName: 'fzuChannel',
        peers: ["peer0.org1.example.com","peer1.org1.example.com"],
        userName: 'admin',
        orgName: 'Org1'
    };

    /**
     * 将peer节点加入到指定channel
     * @param channelName
     * @param peers
     * @param userName
     * @param orgName
     */
    join_channel.peerJoinChannel = async function(channelName, peers, userName, orgName){
        logger.info('[FzuChain]: ==============Peer Join Channel Start!==============');

        let error_message = null;
        let all_eventhubs = [];
        try{
            let client = await helper.getClientForOrg(orgName, userName);
            //获取指定的channel对象
            let channel = client.getChannel(channelName);
            if(!channel) {
                let message = util.format('[FzuChain]: Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            //添加从orderer获取genesis_block的请求
            let request = {
                txId: client.newTransactionID(true)
            };
            //获取genesis_block
            let genesis_block = await channel.getGenesisBlock(request);
            // console.log(genesis_block.metadata);

            // 告诉节点加入channel，等待每个节点的event hub通知我们节点加入channel成功
            let promises = [];
            let block_registration_numbers = [];
            // console.log(client._network_config._network_config.organizations.Org1);
            //按照当前加载的网络配置中的定义，返回已命名组织的EventHub列表。
            let event_hubs = client.getEventHubsForOrg(orgName);
            // console.log(event_hubs[0]._clientContext._userContext._signingIdentity);
            // console.log(event_hubs[0]._clientContext._userContext);
            event_hubs.forEach((eventHubs)=>{
                let configBlockPromise = new Promise((resolve, reject)=>{
                    //设置超时时间
                    console.log(eventHubs._ep._endpoint.addr);
                    let event_timeout = setTimeout(() => {
                        let message = 'REQUEST_TIMEOUT:' + eventHubs._ep._endpoint.addr;
                        logger.info('[FzuChain]: '+message);
                        eventHubs.disconnect();
                        reject(new Error(message));
                    }, 60000);

                    //注册一个监听者接受所有来自peer所属通道的block event.
                    let block_registration_number = eventHubs.registerBlockEvent((block)=>{
                        clearTimeout(event_timeout);
                        // 配置区块中只能有一个交易
                        if (block.data.data.length === 1) {
                            //一个peer可能有多个channel,所以我们必须检查这个block来自我们要加入的channel
                            let first_tx = block.data.data[0]; // get the first transaction
                            let header = first_tx.payload.header; // the "header" object contains metadata of the transaction
                            let channel_id = header.channel_header.channel_id;
                            // let channel_header = block.data.data[0].payload.header.channel_header;
                            if (channel_id === channelName) {
                                let message = util.format('EventHub %s has reported a block update for channel %s',eventHubs._ep._endpoint.addr,channelName);
                                logger.info('[FzuChain]: '+message);
                                resolve(message);
                            } else {
                                let message = util.format('Unknown channel block event received from %s',eventHubs._ep._endpoint.addr);
                                logger.error('[FzuChain]: '+message);
                                reject(new Error(message));
                            }
                        }
                    }, (err)=>{
                        clearTimeout(event_timeout);
                        let message = 'Problem setting up the event hub :'+ err.toString();
                        logger.error('[FzuChain]: '+message);
                        reject(new Error(message));
                    });
                    // 每一个client实例对应一个注册number，后面将作为参数对监听进行注销
                    block_registration_numbers.push(block_registration_number);
                    // 保存EventHub对象，方便后面对事件流断开连接
                    all_eventhubs.push(eventHubs);
                });
                //添加promise对象
                promises.push(configBlockPromise);
                //开启事件流
                eventHubs.connect();
            });

            //构建加入通道请求
            let peer_join_request = {
                targets: peers,
                txId: client.newTransactionID(true),
                block: genesis_block
            };

            // 调用SDK中的joinChannel()方法，主要是通过sendPeersProposal()将
            // 加入channel的交易提案发送给背书节点进行背书
            let join_promise = channel.joinChannel(peer_join_request);
            // 保存返回结果：提案响应（ProposalResponse）的Promise
            promises.push(join_promise);
            console.log('test');
            //获取所有结果数组
            let results = await Promise.all(promises);
            console.log(results);

            logger.debug(util.format('[FzuChain]: Join Channel RESPONSE : %j', results));

            // 检查所有Promise返回（包括监听事件和发送join请求）
            // 只要有一个结果异常则宣布join channel失败
            let peers_results = results.pop();

            for(let item of peers_results) {
                let peer_result = item;
                if(peer_result.response && peer_result.response.status == 200) {
                    logger.info('[FzuChain]: Successfully joined peer to the channel %s',channelName);
                } else {
                    let message = util.format('[FzuChain]: Failed to joined peer to the channel %s',channelName);
                    error_message = message;
                    logger.error(message);
                }
            }
            // 查看事件中心的消息报告
            for(let i in results) {
                let event_hub_result = results[i];
                let event_hub = event_hubs[i];
                let block_registration_number = block_registration_numbers[i];
                logger.debug('[FzuChain]: Event results for event hub :%s',event_hub._ep._endpoint.addr);
                if(typeof event_hub_result === 'string') {
                    logger.debug(event_hub_result);
                } else {
                    if(!error_message) error_message = event_hub_result.toString();
                    logger.debug(event_hub_result.toString());
                }
                // 注销事件监听
                event_hub.unregisterBlockEvent(block_registration_number);
            }

            logger.info('[FzuChain]: ==============Peer Join Channel End!==============');
        }catch(error) {
            logger.error('[FzuChain]: Failed to join channel due to error: ' + error.stack ? error.stack : error);
            error_message = error.toString();
        }

        //关闭事件流
        all_eventhubs.forEach((eventHubs) => {
            eventHubs.disconnect();
        });

        if (!error_message) {
            let message = util.format(
                '[FzuChain]: Successfully joined peers in organization %s to the channel:%s',
                orgName, channelName);
            logger.info(message);
            // build a response to send back to the REST caller
            let res = {
                success: true,
                message: message
            };
            return res;
        } else {
            let message = util.format('[FzuChain]: Failed to join all peers to channel. cause:%s',error_message);
            logger.error(message);
            throw new Error(message);
        }
    };

    return join_channel;
};