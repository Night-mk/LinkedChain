module.exports = function(logger){
    let helper = {};
    let FabricClient = require('fabric-client');
    let ORGS = FabricClient.getConfigSetting('network-config');

    let fs = require('fs');
    let path = require('path');

    /**
     * 根据org组织名获取client
     * 读取相关网络配置文件network-config.yaml,为新的fabricClient设置网络结构参数
     * @param userorg
     * @param username
     * @returns {Client}
     */
    helper.getClientForOrg = async function(userorg, username){
        logger.info('[FzuChain]: getClientForOrg START! %s, %s', userorg, username);

        let config = '-connection-profile-path';
        //为client设置network-config配置
        let client = FabricClient.loadFromConfig(FabricClient.getConfigSetting('network'+config));
        // 此步是加载 userorg.yaml 其中userorg为org1/org2
        // 文件中包含用户状态存储路径（用户键值对）以及公私钥的存储路径（一系列密钥对）
        client.loadFromConfig(FabricClient.getConfigSetting(userorg+config));
        //创建配置中设置的关于client的 state store和crypto store
        await client.initCredentialStores();
        //单纯查询username是否存在
        if(username) {
            let user = await client.getUserContext(username,true);
            if(!user) {
                logger.error('[FzuChain]: User was not found :',username);
                throw new Error(util.format('User was not found :', username));
            } else {
                // console.log(user.getIdentity());
                logger.info('[FzuChain]: User %s was found to be registered and enrolled', username);
            }
        }

        logger.info('[FzuChain]: getClientForOrg END!');

        return client;
    };

    helper.setupChaincodeDeploy = function() {
        //console.log(__dirname);
        process.env.GOPATH = path.join(__dirname, '../../../e2e_cli/chaincode');
        console.log(process.env.GOPATH);
    };

    return helper;
};