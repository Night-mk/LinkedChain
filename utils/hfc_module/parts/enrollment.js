//-------------------------------------------------------------------
// Enrollment && Register HFC
//-------------------------------------------------------------------

module.exports = function(logger){
    let FabricClient = require('fabric-client');
    let User = require('fabric-client/lib/User');
    let FabricCaClient = require('fabric-ca-client');
    let path = require('path');
    let helper = require('./helper')(logger);
    let enrollment = {};


    optionsAdmin ={
        uuid: '001',
        ca_url: 'http://localhost:7054',
        ca_name: 'ca.fzu.com',
        enroll_id: 'admin',
        enroll_secret: 'adminpw',
        msp_id: 'Org1MSP',
        ca_tls_opts: {
            pem: 'ca.org1.example.com-cert.pem'
        },
        crypto_suite: ''
    };

    //注册Admin用户
    enrollment.enrollAdmin = function(options, cb){
        let fabric_client = new FabricClient();
        // let fabric_client = helper.getClientForOrg(options.msp_id, options.enroll_id);
        // let fabric_ca_client = null;
        let admin_user = null;
        let kvs_path = path.join(__dirname, 'config/hfc-key-store');

        let debug = {
            uuid: options.uuid,
            ca_url: options.ca_url,
            ca_name: options.ca_name,
            enroll_id: options.enroll_id,
            enroll_secret: options.enroll_secret,
            msp_id: options.msp_id,
            kvs_path: kvs_path
        };
        logger.info('[FzuChain_info] Going to enroll', debug);

        //进行Key Value Store
        FabricClient.newDefaultKeyValueStore({
            path: kvs_path
        }).then(function (store) {
            fabric_client.setStateStore(store);
            //设置crypto_suite及其存储
            let crypto_suite = FabricClient.newCryptoSuite();
            let crypto_store = FabricClient.newCryptoKeyStore({path: kvs_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);
            //设置crypto_suite字段
            options.crypto_suite = crypto_suite;

            return getAdminSubmitter(fabric_client, options);
        }).then((admin_user) => {
            return;
        }).catch((err) => {
            // --- Failure --- //
            logger.error('[FzuChain_error] Failed to get Admin enrollment ' + options.uuid, err.stack ? err.stack : err);
        });

    };

    //获取admin注册者信息并提供注册服务
    function getAdminSubmitter(fabric_client, options) {
        let admin_user;
        return fabric_client.getUserContext(options.enroll_id, true)
            .then((user_from_store) => {
                //判断admin用户是否已经注册
                if(user_from_store && user_from_store.isEnrolled()){
                    if(user_from_store._mspId !== options.msp_id){
                        logger.warn('[FzuChain_info] The msp id in KVS does not match the msp id passed to enroll. Need to clear the KVS.', user_from_store._mspId, options.msp_id);
                    }else {
                        logger.info('[FzuChain_info] Successfully loaded Admin from persistence');
                        admin_user = user_from_store;
                        return admin_user;
                    }
                }else{
                    //使用CA注册admin用户
                    let tlsOptions = {
                        // trustedRoots: [options.ca_tls_opts.pem],
                        trustedRoots: [],
                        verify: false
                    };
                    let fabric_ca_client = new FabricCaClient(options.ca_url, tlsOptions, options.ca_name, options.crypto_suite);
                    admin_user = new User(options.enroll_id);

                    logger.debug('[FzuChain_debug] enroll id: "' + options.enroll_id + '", secret: "' + options.enroll_secret + '"');
                    logger.debug('[FzuChain_debug] msp_id: ', options.msp_id, 'ca_name:', options.ca_name);

                    return fabric_ca_client.enroll({
                        enrollmentID: options.enroll_id,
                        enrollmentSecret: options.enroll_secret
                    }).then((enrollment) => {
                        //使用setEnrollment方法设置enroll
                        logger.info('[FzuChain_info] Successfully enrolled Admin user \'' + options.enroll_id + '\'');
                        return admin_user.setEnrollment(enrollment.key, enrollment.certificate, options.msp_id);
                    }).then(() =>{
                        //存储私钥、证书
                        return fabric_client.setUserContext(admin_user);
                    }).then(() =>{
                        return admin_user;
                    }).catch((err) =>{
                        // Send Errors
                        logger.error('[FzuChain_error] Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
                        throw new Error('Failed to obtain an enrolled admin_user');
                    });
                }

            });
    }

    optionsUser ={
        uuid: '002',
        ca_url: 'http://localhost:7054',
        ca_name: 'ca.fzu.com',
        enroll_id: 'User1',
        msp_id: 'Org1MSP',
        role: 'client',
        ca_tls_opts: {
            // pem: 'complete tls certificate',
            // ssl-target-name-override: 'common name used in pem certificate'
            // grpc.keepalive_time_ms: <integer in milliseconds>,
            // grpc.keepalive_timeout_ms: <integer in milliseconds>
        },
        crypto_suite: {}
    };

    //注册User用户
    enrollment.enrollUser = function(options, cb){
        let fabric_client = new FabricClient();
        // let fabric_client = helper.getClientForOrg(options.msp_id, options.enroll_id);
        let kvs_path = path.join(__dirname, 'config/hfc-key-store');

        let debug = {
            uuid: options.uuid,
            ca_url: options.ca_url,
            ca_name: options.ca_name,
            enroll_id: options.enroll_id,
            msp_id: options.msp_id,
            role: options.role,
            kvs_path: kvs_path
        };
        logger.info('[FzuChain_info] Going to enroll', debug);

        //进行Key Value Store
        FabricClient.newDefaultKeyValueStore({
            path: kvs_path
        }).then(function (store) {
            fabric_client.setStateStore(store);
            //设置crypto_suite及其存储
            let crypto_suite = FabricClient.newCryptoSuite();
            let crypto_store = FabricClient.newCryptoKeyStore({path: kvs_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);
            //设置crypto_suite字段
            options.crypto_suite = crypto_suite;

            return getUserSubmitter(fabric_client, options);
        }).then(() => {
            return;
        }).catch((err) => {
            // --- Failure --- //
            logger.error('[FzuChain_error] Failed to get User enrollment ' + options.uuid, err.stack ? err.stack : err);
        });
    };

    //获取User注册者信息并提供注册服务
    function getUserSubmitter(fabric_client, options) {
        let admin_user;
        let user = null;
        let fabric_ca_client = null;
        return fabric_client.getUserContext("admin", true)
            .then((user_from_store) => {
                //判断admin用户是否已经注册
                if (user_from_store && user_from_store.isEnrolled()) {
                    logger.info('[FzuChain_info] Successfully loaded admin_user from persistence');
                    admin_user = user_from_store;
                } else {
                    logger.error('[FzuChain_info] Failed loaded admin_user from persistence');
                    throw new Error('Failed to get admin.... run');
                }

                fabric_ca_client= new FabricCaClient(options.ca_url, null, '', options.crypto_suite);
                user = new User(options.enroll_id);
                logger.info('[FzuChain_info] %s', options.msp_id);
                //使用CA register User用户
                return fabric_ca_client.register({
                    enrollmentID: options.enroll_id,
                    affiliation: options.msp_id.toLowerCase() + '.department1',
                    role: options.role
                }, admin_user);
            })
            .then((enroll_secret) =>{
                logger.debug('[FzuChain_debug] enroll id: "' + options.enroll_id + '", secret: "' + enroll_secret + '"');
                logger.debug('[FzuChain_debug] msp_id: ', options.msp_id, 'ca_name:', options.ca_name);
                //使用CA enroll User用户
                return fabric_ca_client.enroll({
                    enrollmentID: options.enroll_id,
                    enrollmentSecret: enroll_secret
                });
                //输出CA生成的enroll_secret
            })
            .then((enrollment) => {
                //使用setEnrollment方法设置enroll
                return user.setEnrollment(enrollment.key, enrollment.certificate, options.msp_id);
            }).then(() =>{
                //存储私钥、证书
                return fabric_client.setUserContext(user);
            }).then(() =>{
                logger.info('[FzuChain_info] Successfully enrolled User \'' + options.enroll_id + '\'');
                return user;
            }).catch((err) =>{
                // Send Errors
                logger.error('[FzuChain_error] Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
                throw new Error('Failed to obtain an enrolled User');
            });
        }

    return enrollment;
};