module.exports = function(logger){
    let query_ledger = {};
    var util = require('util');
    let helper = require('./helper')(logger);

    optionsqueryChaincode = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName : 'fzuchannel',
        chaincodeName: 'mycc',
        fcn : 'query',
        args : 'a',
        userName: 'User1',
        orgName: 'Org1'
    }

    optionsgetBlockByNumber = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName : 'fzuchannel',
        blockNumber : '1',
        userName: 'User1',
        orgName: 'Org1'
    }

    optionsgetTransactionByID = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName : 'fzuchannel',
        trxnID : 'trxnID',
        userName: 'User1',
        orgName: 'Org1'
    }

    optionsgetBlockByHash = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName : 'fzuchannel',
        hash : 'hash',
        userName: 'User1',
        orgName: 'Org1'
    }

    optionsgetChainInfo = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName : 'fzuchannel',
        userName: 'User1',
        orgName: 'Org1'
    }

    optionsgetInstalledChaincodes = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName : 'fzuchannel',
        type : 'installed',
        userName: 'User1',
        orgName: 'Org1'
    }

    optionsgetinstantiatedChaincodes = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        channelName : 'fzuchannel',
        type : 'instantiated',
        userName: 'User1',
        orgName: 'Org1'
    }

    optionsgetChannels = {
        peer : ["peer0.org1.example.com","peer1.org1.example.com"],
        userName: 'User1',
        orgName: 'Org1'
    }

    // Query on chaincode on target peers
    query_ledger.queryChaincode = async function (peer, channelName, chaincodeName, fcn, args, userName, orgName) {
        logger.debug('\n\n============ queryChaincode ============\n');
        try {
            // first setup the client for this org
            var client = await helper.getClientForOrg(orgName, userName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
            var channel = client.getChannel(channelName);
            if(!channel) {
                let message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            // send query
            var request = {
                targets : [peer], //queryByChaincode allows for multiple targets
                chaincodeId: chaincodeName,
                fcn: fcn,
                args: args
            };
            let response_payloads = await channel.queryByChaincode(request);
            if (response_payloads) {
                for (let i = 0; i < response_payloads.length; i++) {
                    logger.info(args[0]+' now has ' + response_payloads[i].toString('utf8') +
                        ' after the move');
                }
                return args[0]+' now has ' + response_payloads[0].toString('utf8') +
                    ' after the move';
            } else {
                logger.error('response_payloads is null');
                return 'response_payloads is null';
            }
        } catch(error) {
            logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
            return error.toString();
        }
    };
    // Query Get Block by BlockNumber
    query_ledger.getBlockByNumber = async function (peer, channelName, blockNumber, userName, orgName) {
        logger.debug('\n\n============ getBlockByNumber ============\n');
        try {
            // first setup the client for this org
            var client = await helper.getClientForOrg(orgName, userName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
            var channel = client.getChannel(channelName);
            if(!channel) {
                let message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            let response_payload = await channel.queryBlock(parseInt(blockNumber, peer));
            if (response_payload) {
                logger.debug(response_payload);
                return response_payload;
            } else {
                logger.error('response_payload is null');
                return 'response_payload is null';
            }
        } catch(error) {
            logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
            return error.toString();
        }
    };
    // Query Get Transaction by Transaction ID
    query_ledger.getTransactionByID = async function(peer, channelName, trxnID, userName, orgName){
        logger.debug('\n\n============ getTransactionByID ============\n');
        try {
            // first setup the client for this org
            var client = await helper.getClientForOrg(orgName, userName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
            var channel = client.getChannel(channelName);
            if(!channel) {
                let message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            let response_payload = await channel.queryTransaction(trxnID, peer);
            if (response_payload) {
                logger.debug(response_payload);
                return response_payload;
            } else {
                logger.error('response_payload is null');
                return 'response_payload is null';
            }
        } catch(error) {
            logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
            return error.toString();
        }
    };
    // Query Get Block by Hash
    query_ledger.getBlockByHash = async function(peer, channelName, hash, userName, orgName) {
        logger.debug('\n\n============ getBlockByHash ============\n');
        try {
            // first setup the client for this org
            var client = await helper.getClientForOrg(orgName, userName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
            var channel = client.getChannel(channelName);
            if(!channel) {
                let message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            let response_payload = await channel.queryBlockByHash(Buffer.from(hash), peer);
            if (response_payload) {
                logger.debug(response_payload);
                return response_payload;
            } else {
                logger.error('response_payload is null');
                return 'response_payload is null';
            }
        } catch(error) {
            logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
            return error.toString();
        }
    };
    // Query for Channel Information
    query_ledger.getChainInfo = async function(peer, channelName, userName, orgName) {
        logger.debug('\n\n============ getChainInfo ============\n');
        try {
            // first setup the client for this org
            var client = await helper.getClientForOrg(orgName, userName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
            var channel = client.getChannel(channelName);
            if(!channel) {
                let message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            let response_payload = await channel.queryInfo(peer);
            if (response_payload) {
                logger.debug(response_payload);
                return response_payload;
            } else {
                logger.error('response_payload is null');
                return 'response_payload is null';
            }
        } catch(error) {
            logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
            return error.toString();
        }
    };
    // Query for Channel instantiated chaincodes
    // Query to fetch all Installed/instantiated chaincodes
    query_ledger.getInstalledChaincodes = async function(peer, channelName, type, userName, orgName) {
        logger.debug('\n\n============ getInstalledChaincodes ============\n');
        try {
            // first setup the client for this org
            var client = await helper.getClientForOrg(orgName, userName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

            let response = null;
            if (type === 'installed') {
                response = await client.queryInstalledChaincodes(peer, true); //use the admin identity
            } else {
                var channel = client.getChannel(channelName);
                if(!channel) {
                    let message = util.format('Channel %s was not defined in the connection profile', channelName);
                    logger.error(message);
                    throw new Error(message);
                }
                response = await channel.queryInstantiatedChaincodes(peer, true); //use the admin identity
            }
            if (response) {
                if (type === 'installed') {
                    logger.debug('<<< Installed Chaincodes >>>');
                } else {
                    logger.debug('<<< Instantiated Chaincodes >>>');
                }
                var details = [];
                for (let i = 0; i < response.chaincodes.length; i++) {
                    console.log(response.chaincodes[i].id);
                    logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
                        response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
                    );
                    details.push('name: ' + response.chaincodes[i].name + ', version: ' +
                        response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
                    );
                }
                return details;
            } else {
                logger.error('response is null');
                return 'response is null';
            }
        } catch(error) {
            logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
            return error.toString();
        }
    };
    // Query to fetch channels
    query_ledger.getChannels = async function(peer, userName, orgName) {
        logger.debug('\n\n============ getChannels ============\n');
        try {
            // first setup the client for this org
            var client = await helper.getClientForOrg(orgName, userName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

            let response = await client.queryChannels(peer);
            if (response) {
                logger.debug('<<< channels >>>');
                var channelNames = [];
                for (let i = 0; i < response.channels.length; i++) {
                    channelNames.push('channel id: ' + response.channels[i].channel_id);
                }
                logger.debug(channelNames);
                return response;
            } else {
                logger.error('response_payloads is null');
                return 'response_payloads is null';
            }
        } catch(error) {
            logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
            return error.toString();
        }
    };

    return query_ledger;
}