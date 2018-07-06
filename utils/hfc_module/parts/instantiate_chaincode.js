module.exports = function(logger){
    let instantiate_chaincode = {};

    let util = require('util');
    let path = require('path');
    let helper = require('./helper')(logger);

    optionsInstantiateChaincode = {
        channelName: 'fzuchannel',
        chaincodeName:'test',
        chaincodeVersion:'v0',
        chaincodeType: 'golang',
        args : ["a","100","b","200"],
        userName: 'User1',
        orgName:'Org1'

    };

    instantiate_chaincode.instantiateChaincode = async function(peers,channelName, chaincodeName, chaincodeVersion,
                                           chaincodeType, functionName, args, userName, orgName){
        logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
            ' ============\n');
        var error_message = null;
        var eventhubs_in_use = [];

        console.log(process.env.GOPATH);

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
            var tx_id = client.newTransactionID(true); // Get an admin based transactionID
            // An admin based transactionID will
            // indicate that admin identity should
            // be used to sign the proposal request.
            // will need the transaction ID string for the event registration later
            var deployId = tx_id.getTransactionID();

            // send proposal to endorser
            var request = {
                targets : peers,
                chaincodeId: chaincodeName,
                chaincodeType: chaincodeType,
                chaincodeVersion: chaincodeVersion,
                args: args,
                txId: tx_id
            };
            console.log(request);

            if (functionName)
                request.fcn = functionName;

            let results = await channel.sendInstantiateProposal(request, 60000); //instantiate takes much longer

            // console.log(results);
            // the returned object has both the endorsement results
            // and the actual proposal, the proposal will be needed
            // later when we send a transaction to the orderer
            var proposalResponses = results[0];
            var proposal = results[1];


            logger.debug(proposalResponses);
            // lets have a look at the responses to see if they are
            // all good, if good they will also include signatures
            // required to be committed
            var all_good = true;
            for (var i in proposalResponses) {
                let one_good = false;
                if (proposalResponses && proposalResponses[i].response &&
                    proposalResponses[i].response.status === 200) {
                    one_good = true;
                    logger.info('instantiate proposal was good');
                } else {
                    logger.error('instantiate proposal was bad');
                }
                all_good = all_good & one_good;
            }

            if (all_good) {
                logger.info(util.format(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                    proposalResponses[0].response.status, proposalResponses[0].response.message,
                    proposalResponses[0].response.payload, proposalResponses[0].endorsement
                        .signature));

                // tell each peer to join and wait for the event hub of each peer to tell us
                // that the channel has been created on each peer
                var promises = [];
                let event_hubs = client.getEventHubsForOrg(orgName);
                logger.debug('found %s eventhubs for this organization %s',event_hubs.length, orgName);
                event_hubs.forEach((eh) => {
                    let instantiateEventPromise = new Promise((resolve, reject) => {
                        logger.debug('instantiateEventPromise - setting up event');
                        let event_timeout = setTimeout(() => {
                            let message = 'REQUEST_TIMEOUT:' + eh._ep._endpoint.addr;
                            logger.error(message);
                            eh.disconnect();
                            reject(new Error(message));
                        }, 60000);
                        eh.registerTxEvent(deployId, (tx, code) => {
                            logger.info('The chaincode instantiate transaction has been committed on peer %s',eh._ep._endpoint.addr);
                            clearTimeout(event_timeout);
                            eh.unregisterTxEvent(deployId);

                            if (code !== 'VALID') {
                                let message = util.format('The chaincode instantiate transaction was invalid, code:%s',code);
                                logger.error(message);
                                reject(new Error(message));
                            } else {
                                let message = 'The chaincode instantiate transaction was valid.';
                                logger.info(message);
                                resolve(message);
                            }
                        }, (err) => {
                            clearTimeout(event_timeout);
                            eh.unregisterTxEvent(deployId);
                            let message = 'Problem setting up the event hub :'+ err.toString();
                            logger.error(message);
                            reject(new Error(message));
                        });
                    });
                    promises.push(instantiateEventPromise);
                    eh.connect();
                    eventhubs_in_use.push(eh);
                });

                var orderer_request = {
                    txId: tx_id, //must includethe transaction id so that the outbound
                                 // transaction to the orderer will be signed by the admin
                                 // id as was the proposal above, notice that transactionID
                                 // generated above was based on the admin id not userContext.
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };
                var sendPromise = channel.sendTransaction(orderer_request);
                // put the send to the orderer last so that the events get registered and
                // are ready for the orderering and committing
                promises.push(sendPromise);
                let results = await Promise.all(promises);
                logger.debug(util.format('------->>> R E S P O N S E : %j', results));
                let response = results.pop(); //  orderer results are last in the results
                if (response.status === 'SUCCESS') {
                    logger.info('Successfully sent transaction to the orderer.');
                } else {
                    error_message = util.format('Failed to order the transaction. Error code: %s',response.status);
                    logger.debug(error_message);
                }

                // now see what each of the event hubs reported
                for(let i in results) {
                    let event_hub_result = results[i];
                    let event_hub = event_hubs[i];
                    logger.debug('Event results for event hub :%s',event_hub._ep._endpoint.addr);
                    if(typeof event_hub_result === 'string') {
                        logger.debug(event_hub_result);
                    } else {
                        if(!error_message) error_message = event_hub_result.toString();
                        logger.debug(event_hub_result.toString());
                    }
                }
            } else {
                error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
                logger.debug(error_message);
            }
        } catch (error) {
            logger.error('Failed to send instantiate due to error: ' + error.stack ? error.stack : error);
            error_message = error.toString();
        }

        // need to shutdown open event streams
        eventhubs_in_use.forEach((eh) => {
            eh.disconnect();
        });

        if (!error_message) {
            let message = util.format(
                'Successfully instantiate chaingcode in organization %s to the channel \'%s\'',
                orgName, channelName);
            logger.info(message);
            // build a response to send back to the REST caller
            let response = {
                success: true,
                message: message
            };
            // return response;
        } else {
            let message = util.format('Failed to instantiate. cause:%s',error_message);
            logger.error(message);
            throw new Error(message);
        }
    }
    return instantiate_chaincode;
};