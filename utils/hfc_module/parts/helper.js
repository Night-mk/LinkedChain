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
    helper.getClientForOrg = function(userorg, username){
        logger.info('[FzuChain]: getClientForOrg START! %s, %s', userorg, username);

        let config = '-connection-profile-path';
        let client;
        let client_promise = new Promise((resolve, reject)=>{
            resolve();
        });
        client_promise.then(()=>{
            //为client设置network-config配置
            client = FabricClient.loadFromConfig(FabricClient.getConfigSetting('network'+config));
            // 此步是加载 userorg.yaml 其中userorg为org1/org2
            // 文件中包含用户状态存储路径（用户键值对）以及公私钥的存储路径（一系列密钥对）
            client.loadFromConfig(FabricClient.getConfigSetting(userorg+config));
            //创建配置中设置的关于client的 state store和crypto store
            client.initCredentialStores().then(()=>{
                //单纯查询username是否存在
                if(username) {
                    client.getUserContext(username, true).then((user)=>{
                        if(!user) {
                            logger.error('[FzuChain]: User was not found :',username);
                            throw new Error(util.format('User was not found :', username));
                        } else {
                            logger.info('[FzuChain]: User %s was found to be registered and enrolled', username);
                        }
                    });
                }
            });

            logger.info('[FzuChain]: getClientForOrg END!');

            return client;
        });

        return client_promise;
    };

    return helper;
};