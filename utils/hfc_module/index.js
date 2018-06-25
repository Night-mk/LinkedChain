//-------------------------------------------------------------------
// Fabric Client Module - Wrapper library for the Hyperledger Fabric Client SDK
//-------------------------------------------------------------------

module.exports = function (g_options, logger) {
    let fcm = {};
    let enrollment = require('./parts/enrollment')(logger);
    let create_channel = require('./parts/create_channel')(logger);


    // ------------------------------------------------------------------------
    // Enrollment Functions
    // ------------------------------------------------------------------------
    fcm.enrollAdmin = function (options, cb_done) {
        //可能寻求新CA注册，获取CA服务列表
        // let opts = get_ca(options);
        enrollment.enrollAdmin(options, cb_done);

    };

    fcm.enrollUser = function (options, cb_done) {
        enrollment.enrollUser(options, cb_done);
    };

    // ------------------------------------------------------------------------
    // Create Channel Functions
    // ------------------------------------------------------------------------
    fcm.createChannel = function (options) {
        create_channel.createChannel(options.channelName, options.channelConfigPath, options.userName, options.orgName);
    };


    return fcm;
};