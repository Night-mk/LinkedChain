//-------------------------------------------------------------------
// Unit Test Module
//-------------------------------------------------------------------



var winston = require('winston');
var logger = new (winston.Logger)({
    level: 'debug',
    transports: [
        new (winston.transports.Console)({ colorize: true }),
    ]
});
var g_options = {};
var fcm = require('./hfc_module/index')(g_options, logger);
require('./hfc_module/config');

//test enrollAdmin

optionsAdmin ={
    uuid: '001',
    ca_url: 'http://localhost:7054',
    ca_name: 'ca.fzu.com-org1',
    enroll_id: 'admin',
    enroll_secret: 'adminpw',
    msp_id: 'Org1',
    ca_tls_opts: {
        pem: 'ca.org1.example.com-cert.pem'
    },
    crypto_suite: {}
};

// test enrollUser
optionsUser ={
    uuid: '002',
    ca_url: 'http://localhost:7054',
    ca_name: 'ca.fzu.com-org1',
    enroll_id: 'User1',
    msp_id: 'Org1',
    role: 'client',
    ca_tls_opts: {
        pem: 'ca.org1.example.com-cert.pem'
    },
    crypto_suite: {}
};

optionsCreateChannel = {
    channelName: 'fzuchannel',
    channelConfigPath: '../../../e2e_cli/channel-artifacts/channel.tx',
    userName: 'User1',
    orgName: 'Org1'
};

// fcm.enrollAdmin(optionsAdmin,function () {});
// fcm.enrollUser(optionsUser,function () {});

fcm.createChannel(optionsCreateChannel);

