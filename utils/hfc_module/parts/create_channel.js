module.exports = function(logger){
    let create_channel = {};

    let fs = require('fs');
    let path = require('path');
    let helper = require('./helper')(logger);

    //在生成通道配置的时候需要定义：channel name
    options = {
        channelName: 'fzuChannel',
        channelConfigPath: 'e2e_cli/channel-artifacts/channel.tx',
        userName: 'admin',
        orgName: 'Org1'
    };

    /**
     * 创建channel
     * @param channelName
     * @param channelConfigPath
     * @param userName
     * @param orgName
     */
    create_channel.createChannel = function(channelName, channelConfigPath, userName, orgName){
        logger.info('[FzuChain]: ==============Creating Channel!==============');

        try{
            //初始化一个有org配置的client
            let client = helper.getClientForOrg(orgName, userName);
            logger.info('[FzuChain]: Successfully got the fabric client for the organization "%s"', orgName);

            //读取.tx通道配置文件
            let envelope = fs.readFileSync(path.join(__dirname, channelConfigPath));
            //从envelope文件中提取通道配置字节进行签名
            let channelConfig = client.extractChannelConfig(envelope);
            //签名通道配置字节
            let signature = client.signChannelConfig(channelConfig);

            //创建通道请求request构建
            //此处只有一个order节点,否则需要添加orderer参数
            let request = {
                config: channelConfig,
                signatures: [signature],
                name: channelName,
                txId: client.newTransactionID(true) // get an admin based transactionID
            };

            //根据请求request创建Channel,该请求发给orderer节点
            //由于client已经从配置好的network-config.yaml文件中读取了order信息,所以request中无须添加orderer节点信息
            client.createChannel(request).then((response)=>{
                logger.info('[FzuChain]: Create Channel Response "%s"', response);
                if(response && response.status === 'SUCCESS'){
                    logger.info('[FzuChain]: Successfully Create Channel %s !', channelName);
                    let res = {
                        success: true,
                        message: 'Channel \'' + channelName + '\' created Successfully'
                    };
                    return res;
                }else{
                    logger.error('\n[FzuChain] !!!!!!!!! Failed to create the channel \'' + channelName + '\' !!!!!!!!!\n\n');
                    throw new Error('Failed to create the channel \'' + channelName + '\'');
                }
            });
        }catch(err){
            // --- Failure --- //
            logger.error('[FzuChain] Failed to get User enrollment ' + options.uuid, err.stack ? err.stack : err);
            throw new Error('Failed to initialize the channel: %s' + err.toString());
        }

    };


    return create_channel;
};