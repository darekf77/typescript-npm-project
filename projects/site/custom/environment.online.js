const { config } = require('./environment');

config.ip = '46.101.247.105';
config.domain = undefined;

const webApp = config.workspace.projects.find(p => p.name === 'ss-webapp')
webApp.ommitAppBuild = true;


const uiApp = config.workspace.projects.find(p => p.name === 'ss-common-ui')
uiApp.ommitAppBuild = true;

module.exports = exports = { config };
