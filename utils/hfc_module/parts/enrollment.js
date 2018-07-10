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
        org_name: 'Org1'
    };

    //注册Admin用户
    enrollment.enrollAdmin = async function(options, cb) {
        logger.info('[FzuChain]: ==============Enroll Admin Start!==============');
        //返回值
        let res = null;
        try{
            let fabric_client = await helper.getClientForOrg(options.org_name);
            let debug = {
                ca_name: options.ca_name,
                enroll_id: options.enroll_id,
                msp_id: options.msp_id,
                org_name: options.org_name,
                role: options.role
            };
            logger.info('[FzuChain] Going to enroll', debug);

            let admin_user = await fabric_client.getUserContext(options.enroll_id, true);
            if(admin_user && admin_user.isEnrolled()){
                logger.info('[FzuChain] Successfully loaded Admin: %s from persistence', options.enroll_id);
            }else{
                let fabric_ca_client = fabric_client.getCertificateAuthority();
                logger.debug('[FzuChain] enroll id: "' + options.enroll_id + '", secret: "' + options.enroll_secret + '"');

                await fabric_ca_client.enroll({
                    enrollmentID: options.enroll_id,
                    enrollmentSecret: options.enroll_secret
                });

                // let user_enroll = admin_user.setEnrollment(enrollment.key, enrollment.certificate, options.msp_id);
                admin_user = await fabric_client.setUserContext({username:options.enroll_id, password:options.enroll_secret});

                logger.debug('Successfully enrolled username %s  and setUserContext on the client object', options.enroll_id);
                logger.info('[FzuChain]: ==============Enroll Admin End!==============');
            }

            if(admin_user && admin_user.isEnrolled()) {
                res = {
                    success: true,
                    message: options.enroll_id + ' enrolled Successfully',
                };
                return res;
            } else {
                res = {
                    success: false,
                    message: options.enroll_id + ' enrolled Failed',
                };
                return res;
                throw new Error('Admin was not enrolled ');
            }
        }catch (error) {
            logger.error('[FzuChain] Failed to get registered Admin: %s with error: %s', options.enroll_id, error.toString());
            res = {
                success: false,
                message: options.enroll_id + ' enrolled Failed'+ error.toString()
            };
            return res;
        }

    };

    optionsUser ={
        uuid: '002',
        ca_url: 'http://localhost:7054',
        ca_name: 'ca.fzu.com',
        enroll_id: 'User1',
        msp_id: 'Org1MSP',
        org_name: 'Org1',
        role: 'user',
        ca_tls_opts: {
            // pem: 'complete tls certificate',
            // ssl-target-name-override: 'common name used in pem certificate'
            // grpc.keepalive_time_ms: <integer in milliseconds>,
            // grpc.keepalive_timeout_ms: <integer in milliseconds>
        },
        crypto_suite: {}
    };

    //注册User用户
    enrollment.enrollUser = async function(options, cb) {
        logger.info('[FzuChain]: ==============Enroll User Start!==============');
        let res = null;
        try{
            let fabric_client = await helper.getClientForOrg(options.org_name);
            let debug = {
                ca_name: options.ca_name,
                enroll_id: options.enroll_id,
                msp_id: options.msp_id,
                org_name: options.org_name,
                role: options.role
            };
            logger.info('[FzuChain] Going to enroll', debug);

            let user = await fabric_client.getUserContext(options.enroll_id, true);
            if(user && user.isEnrolled()){
                logger.info('[FzuChain] Successfully loaded User: %s from persistence', options.enroll_id);
            }else{
                let admin_user = await fabric_client.getUserContext('admin', true);
                //判断admin用户是否已经注册
                if (admin_user && admin_user.isEnrolled()) {
                    logger.info('[FzuChain] Successfully loaded admin_user from persistence');
                } else {
                    logger.error('[FzuChain] Failed loaded admin_user from persistence');
                    throw new Error('Failed to get admin.... run');
                }
                let fabric_ca_client = fabric_client.getCertificateAuthority();

                let secret = await fabric_ca_client.register({
                    enrollmentID: options.enroll_id,
                    affiliation: options.org_name.toLowerCase() + '.department1',
                    role: options.role
                },admin_user);

                options.enroll_secret = secret;
                logger.debug('[FzuChain] enroll id: "' + options.enroll_id + '", secret: "' + options.enroll_secret + '"');
                let enrollment = await fabric_ca_client.enroll({
                    enrollmentID: options.enroll_id,
                    enrollmentSecret: options.enroll_secret
                });

                // let user_enroll = user.setEnrollment(enrollment.key, enrollment.certificate, options.msp_id);
                user = await fabric_client.setUserContext({username:options.enroll_id, password:options.enroll_secret});

                logger.debug('Successfully enrolled username %s  and setUserContext on the client object', options.enroll_id);
                logger.info('[FzuChain]: ==============Enroll User End!==============');
            }

            if(user && user.isEnrolled()) {
                res = {
                    success: true,
                    secret: options.enroll_secret,
                    message: options.enroll_id + ' enrolled Successfully',
                };
                return res;
            } else {
                res = {
                    success: false,
                    secret: '',
                    message: options.enroll_id + ' enrolled Failed',
                };
                return res;
                throw new Error('User was not enrolled ');
            }
        }catch (error) {
            logger.error('[FzuChain] Failed to get registered user: %s with error: %s', options.enroll_id, error.toString());
            res = {
                success: false,
                secret: '',
                message: options.enroll_id + ' enrolled Failed '+error.toString(),
            };
            return res;
        }

    };

    enrollment.reEnroll = async function (options, cb) {

    };

    return enrollment;
};