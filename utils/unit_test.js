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
var query_ledger = require('./hfc_module/parts/query_ledger')(logger);


//test enrollAdmin
optionsAdmin ={
    enroll_id: 'admin',
    org_name: 'Org1'
};
// test enrollUser
optionsUser ={
    enroll_id: 'User1',
    org_name: 'Org1'
};
//创建channel
optionsCreateChannel = {
    channelName: 'fzuchannel',
    channelConfigPath: '../../../e2e_cli/channel-artifacts/channel.tx',
    userName: 'User1',
    orgName: 'Org1'
};
//加入channel
optionsJoinChannel = {
    channelName: 'fzuchannel',
    peers: ["peer0.org1.example.com","peer1.org1.example.com"],
    userName: 'admin',
    orgName: 'Org1'
};

//安装链码
optionsInstallChaincode = {
    peers: ["peer0.org1.example.com","peer1.org1.example.com"],
    chaincodeName: 'fzu_cc',
    chaincodePath: 'fzuChaincode',
    chaincodeVersion: 'v1',
    chaincodeType: 'golang',
    userName: 'User1',
    orgName: 'Org1'
};

//实例化链码
optionsInstantiateChaincode = {
    peers : ["peer0.org1.example.com","peer1.org1.example.com"],
    channelName: 'fzuchannel',
    chaincodeName:'fzu_cc',
    chaincodeVersion:'v1',
    chaincodeType: 'golang',
    functionName: '',
    args : [],
    userName: 'User1',
    orgName:'Org1'
};
//invoke链码
optionsInvokeChaincode1 = {
    peerName: ["peer0.org1.example.com","peer1.org1.example.com"],
    channelName: 'fzuchannel',
    chaincodeName: 'fzu_cc',
    functionName: 'addEvent',
    args: ["b1", "applyIdentity", "zhang1234", "poverty", "apply for poverty", "passed", "not passed", "c1"],
    userName: 'User1',
    orgName: 'Org1'
};

optionsInvokeChaincode2 = {
    peerName: ["peer0.org1.example.com","peer1.org1.example.com"],
    channelName: 'fzuchannel',
    chaincodeName: 'fzu_cc',
    functionName: 'getEvents',
    args: ['b1'],
    userName: 'User1',
    orgName: 'Org1'
};

//查询链码
optionsgetInstalledChaincodes = {
    peer : "peer0.org1.example.com",
    channelName : 'fzuchannel',
    type : 'installed',
    userName: 'User1',
    orgName: 'Org1'
};

optionsgetTransactionByID = {
    peer : "peer0.org1.example.com",
    channelName : 'fzuchannel',
    trxnID : '40a41b09046c26f5b8ad19c1c912036d31716e824516f867746b4ddd5f094b08',
    userName: 'User1',
    orgName: 'Org1'
};

//更新链码
optionsInstallChaincode2 = {
    peers: ["peer0.org1.example.com","peer1.org1.example.com"],
    chaincodeName: 'fzu_cc',
    chaincodePath: 'test2',
    chaincodeVersion: 'v2',
    chaincodeType: 'golang',
    userName: 'User1',
    orgName: 'Org1'
};

optionsUpdateChaincode = {
    peers: ["peer0.org1.example.com","peer1.org1.example.com"],
    channelName: 'fzuchannel',
    chaincodeName:'fzu_cc',
    chaincodePath: 'fzuChaincode',
    chaincodeType: 'golang',
    userName: 'User1',
    orgName:'Org1'
};

optionsInvokeChaincode3 = {
    peerName: ["peer0.org1.example.com","peer1.org1.example.com"],
    channelName: 'fzuchannel',
    chaincodeName: 'fzu_cc',
    functionName: 'getEvents',
    args: ['b1'],
    userName: 'User1',
    orgName: 'Org1'
}



var test = async function(){
    // let msg = await fcm.enrollAdmin(optionsAdmin,function () {});
    // let msg = await fcm.enrollUser(optionsUser,function () {});
    //
    // let createchannel = await fcm.createChannel(optionsCreateChannel);

    /*
        一起执行
     */
    // await fcm.joinChannel(optionsJoinChannel);
    // let msg = await fcm.installChaincode(optionsInstallChaincode);
    // await fcm.instantiateChaincode(optionsInstantiateChaincode);

    // await fcm.invokeChaincode(optionsInvokeChaincode1);
    // await fcm.invokeChaincode(optionsInvokeChaincode2);

    //第一次更新链码
    // await fcm.updateChaincode(optionsUpdateChaincode);
    // await fcm.invokeChaincode(optionsInvokeChaincode3);
    //
    // await query_ledger.getInstalledChaincodes(optionsgetInstalledChaincodes.peer,
    //     optionsgetInstalledChaincodes.channelName, optionsgetInstalledChaincodes.type,
    //     optionsgetInstalledChaincodes.userName, optionsgetInstalledChaincodes.orgName);
    // await query_ledger.getTransactionByID(optionsgetTransactionByID.peer,
    //     optionsgetTransactionByID.channelName, optionsgetTransactionByID.trxnID,
    //     optionsgetTransactionByID.userName, optionsgetTransactionByID.orgName);
    process.exit(0)
};

test();