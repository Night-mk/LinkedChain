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
var helper = require('./hfc_module/parts/helper')(logger);

//test enrollAdmin

optionsAdmin ={
    uuid: '001',
    ca_url: 'https://localhost:7054',
    ca_name: 'ca.fzu.com-org1',
    enroll_id: 'admin',
    enroll_secret: 'adminpw',
    msp_id: 'Org1MSP',
    org_name: 'Org1',
    ca_tls_opts: {
        pem: 'ca.org1.example.com-cert.pem'
    },
    crypto_suite: {}
};

// test enrollUser
optionsUser ={
    uuid: '002',
    ca_url: 'https://localhost:7054',
    ca_name: 'ca.fzu.com-org1',
    enroll_id: 'User1',
    enroll_secret: '',
    msp_id: 'Org1MSP',
    org_name: 'Org1',
    role: 'user',
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

optionsJoinChannel = {
    channelName: 'fzuchannel',
    peers: ["peer0.org1.example.com","peer1.org1.example.com"],
    // peers: ["peer0.org1.example.com"],
    userName: 'admin',
    orgName: 'Org1'
};

optionsInstallChaincode = {
    peers: ["peer0.org1.example.com","peer1.org1.example.com"],
    chaincodeName: 'mycc1',
    chaincodePath: 'test1',
    chaincodeVersion: 'golang',
    chaincodeType: 'v0',
    userName: 'User1',
    orgName: 'Org1'
};

var test = async function(){
    // await fcm.enrollAdmin(optionsAdmin,function () {});
    // await fcm.enrollUser(optionsUser,function () {});
    // await fcm.createChannel(optionsCreateChannel);
    let msg = await fcm.joinChannel(optionsJoinChannel);
    // let msg = await fcm.installChaincode(optionsInstallChaincode);
};

test();
// fcm.enrollAdmin(optionsAdmin,function () {});
// fcm.enrollUser(optionsUser,function () {});

// fcm.createChannel(optionsCreateChannel);
// let msg = fcm.joinChannel(optionsJoinChannel);
// helper.getClientForOrg(optionsJoinChannel.orgName, optionsJoinChannel.userName);