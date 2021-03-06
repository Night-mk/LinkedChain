let util = require('util');
let path = require('path');
let hfc = require('fabric-client');

let file = 'network-config%s.yaml';

let env = process.env.TARGET_NETWORK;
if (env)
    file = util.format(file, '-' + env);
else
    file = util.format(file, '');
// indicate to the application where the setup file is located so it able
// to have the hfc load it to initalize the fabric client instance
hfc.setConfigSetting('network-connection-profile-path',path.join(__dirname, '../../e2e_cli/config_files/',file));
hfc.setConfigSetting('Org1-connection-profile-path',path.join(__dirname, '../../e2e_cli/config_files/', 'org1.yaml'));
hfc.setConfigSetting('Org2-connection-profile-path',path.join(__dirname, '../../e2e_cli/config_files/', 'org2.yaml'));
// some other settings the application might need to know
// hfc.addConfigFile(path.join(__dirname, 'e2e_cli', 'config.json'));