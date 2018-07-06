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

    // ------------------------------------------------------------------------
    // Enrollment Functions
    // ------------------------------------------------------------------------
    fcm.enrollAdmin = async function (options, cb_done) {
        //可能寻求新CA注册，获取CA服务列表
        // let opts = get_ca(options);
        await enrollment.enrollAdmin(options, cb_done);

    };

    fcm.enrollUser = async function (options, cb_done) {
        await enrollment.enrollUser(options, cb_done);
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
        let message = await join_channel.peerJoinChannel(options.channelName, options.peers, options.userName, options.orgName);
        console.log(message);
        // return message;
    };


    // ------------------------------------------------------------------------
    // Install ChainCode Functions
    // ------------------------------------------------------------------------
    fcm.installChaincode = async function (options) {
        let message = await install_chaincode.installChaincode(
            options.peers, options.chaincodeName, options.chaincodePath,
            options.chaincodeVersion, options.chaincodeType, options.userName, options.orgName
        );
        return message;
    };

    // ------------------------------------------------------------------------
    // Instantiate ChainCode Functions
    // ------------------------------------------------------------------------
    fcm.instantiateChaincode = async function (options) {
        await instantiate_chaincode.instantiateChaincode(options.peers,options.channelName, options.chaincodeName, options.chaincodeVersion,
            options.chaincodeType, options.functionName, options.args, options.userName, options.orgName);
    };

    return fcm;
};