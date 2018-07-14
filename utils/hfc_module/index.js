//-------------------------------------------------------------------
// Fabric Client Module - Wrapper library for the Hyperledger Fabric Client SDK
//-------------------------------------------------------------------

module.exports = function (g_options, logger) {
    let fcm = {};
    let enrollment = require('./parts/enrollment')(logger);
    let create_channel = require('./parts/create_channel')(logger);
    let join_channel = require('./parts/join_channel')(logger);
    let install_chaincode = require('./parts/install_chaincode')(logger);
    let instantiate_chaincode = require('./parts/instantiate_chaincode')(logger);
    let invoke_chaincode = require('./parts/invoke_chaincode')(logger);
    let update_chaincode = require('./parts/update_chaincode')(logger);

    // ------------------------------------------------------------------------
    // Enrollment Functions
    // ------------------------------------------------------------------------
    /**
     * options{
     *  enroll_id: 'admin'
     *  org_name: 'Org1'(首字母大写)
     * }
     * res{
     *  success: true/false
     *  message: xxx
     * }
     * @param options
     * @param cb_done
     * @returns {Promise<*>}
     */
    fcm.enrollAdmin = async function (options, cb_done) {
        //可能寻求新CA注册，获取CA服务列表
        // let opts = get_ca(options);
        let optionsAdmin ={
            uuid: '001',
            ca_name: 'ca.fzu.com-'+options.org_name.toLowerCase(),
            enroll_id: options.enroll_id,
            enroll_secret: 'adminpw',
            msp_id: options.org_name+'MSP',
            org_name: options.org_name
        };
        //返回admin注册成功或者失败的信息
        let msg = await enrollment.enrollAdmin(optionsAdmin, cb_done);
        console.log(msg);
        return msg;
    };

    /**
     * options{
     *  enroll_id: 'User1'
     *  org_name: 'Org1'(首字母大写)
     * }
     * res{
     *  success: true/false
     *  secret: xxx
     *  message: xxx
     * }
     * @param options
     * @param cb_done
     * @returns {Promise<*>}
     */
    fcm.enrollUser = async function (options, cb_done) {
        let optionsUser ={
            uuid: '002',
            ca_name: 'ca.fzu.com-'+options.org_name.toLowerCase(),
            enroll_id: options.enroll_id,
            enroll_secret: '',
            msp_id: options.org_name+'MSP',
            org_name: options.org_name,
            role: 'user'
        };
        let msg = await enrollment.enrollUser(optionsUser, cb_done);
        console.log(msg);
        return msg;
    };

    // ------------------------------------------------------------------------
    // Create Channel Functions
    // ------------------------------------------------------------------------
    fcm.createChannel = function (options) {
        create_channel.createChannel(options.channelName, options.channelConfigPath, options.userName, options.orgName);
    };

    // ------------------------------------------------------------------------
    // Join Channel Functions
    // ------------------------------------------------------------------------
    fcm.joinChannel = async function (options) {
        let msg = await join_channel.peerJoinChannel(options.channelName, options.peers, options.userName, options.orgName);
        console.log(msg);
        // return message;
    };


    // ------------------------------------------------------------------------
    // Install ChainCode Functions
    // ------------------------------------------------------------------------
    fcm.installChaincode = async function (options) {
        let msg = await install_chaincode.installChaincode(
            options.peers, options.chaincodeName, options.chaincodePath,
            options.chaincodeVersion, options.chaincodeType, options.userName, options.orgName
        );
        return msg;
    };

    // ------------------------------------------------------------------------
    // Instantiate ChainCode Functions
    // ------------------------------------------------------------------------
    fcm.instantiateChaincode = async function (options) {
        await instantiate_chaincode.instantiateChaincode(options.peers,options.channelName, options.chaincodeName, options.chaincodeVersion,
            options.chaincodeType, options.functionName, options.args, options.userName, options.orgName);
    };

    // ------------------------------------------------------------------------
    // Invoke ChainCode Functions
    // ------------------------------------------------------------------------
    fcm.invokeChaincode = async function (options) {
        let tx_id = await invoke_chaincode.invokeChaincode(options.peerName, options.channelName, options.chaincodeName,
            options.functionName, options.args, options.userName, options.orgName);
        console.log(tx_id);
    };

    fcm.updateChaincode = async function (options) {
        let tx_id = await update_chaincode.updateChaincode(options.peers, options.channelName, options.chaincodeName, options.chaincodePath,
            options.chaincodeType, options.userName, options.orgName);
        console.log(tx_id);
    };

    return fcm;
};