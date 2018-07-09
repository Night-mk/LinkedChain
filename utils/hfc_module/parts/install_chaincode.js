module.exports = function(logger){
    let install_chaincode = {};
    let FabricClient = require('fabric-client');
    let util = require('util');
    let helper = require('./helper')(logger);
    let tx_id = null;

    let fs = require('fs');
    let path = require('path');

    options = {
        peers: ["peer0.org1.example.com","peer1.org1.example.com"],
        chaincodeName: 'mycc',
        chaincodePath: 'test',
        chaincodeVersion: 'v0',
        chaincodeType: 'golang',
        userName: 'User1',
        orgName: 'Org1'
    };
    /**
     * 安装链码，需要好多参数
     * @param peers
     * @param chaincodeName
     * @param chaincodePath
     * @param chaincodeVersion
     * @param chaincodeType
     * @param userName
     * @param orgName
     * @returns {Promise<{success: boolean, message: *}>}
     */
    install_chaincode.installChaincode = async function(peers, chaincodeName,
                                                        chaincodePath, chaincodeVersion, chaincodeType, userName, orgName) {
        logger.debug('\n\n============ Install chaincode on organizations ============\n');
        helper.setupChaincodeDeploy();
        let error_message = null;

        try {
            logger.info('[FzuChain]: Calling peers in organization "%s" to join the channel', orgName);

            // first setup the client for this org
            let client = await helper.getClientForOrg(orgName, userName);
            logger.debug('[FzuChain]: Successfully got the fabric client for the organization "%s"', orgName);

            tx_id = client.newTransactionID(true); //get an admin transactionID
            let request = {
                targets: peers,
                chaincodePath: chaincodePath,
                chaincodeId: chaincodeName,
                chaincodeVersion: chaincodeVersion,
                chaincodeType: chaincodeType
            };
            //
            let results = await client.installChaincode(request);
            // the returned object has both the endorsement results
            // and the actual proposal, the proposal will be needed
            // later when we send a transaction to the orederer
            let proposalResponses = results[0];
            console.log(proposalResponses);

            // lets have a look at the responses to see if they are
            // all good, if good they will also include signatures
            // required to be committed
            let all_good = true;
            for (let i in proposalResponses) {
                let one_good = false;
                if (proposalResponses && proposalResponses[i].response &&
                    proposalResponses[i].response.status === 200) {
                    one_good = true;
                    logger.info('install proposal was good');
                } else {
                    logger.error('install proposal was bad %j',proposalResponses.toJSON());
                }
                all_good = all_good & one_good;
            }
            if (all_good) {
                logger.info('Successfully sent install Proposal and received ProposalResponse');
            } else {
                error_message = 'Failed to send install Proposal or receive valid response. Response null or status is not 200'
                logger.error(error_message);
            }

        } catch(error) {
            logger.error('Failed to install due to error: ' + error.stack ? error.stack : error);
            error_message = error.toString();
        }


        if (!error_message) {
            let message = util.format('Successfully install chaincode');
            logger.info(message);
            // build a response to send back to the REST caller
            let response = {
                success: true,
                message: message
            };
            return response;
        } else {
            let message = util.format('Failed to install due to:%s',error_message);
            logger.error(message);
            throw new Error(message);
        }

    };

    return install_chaincode;
};