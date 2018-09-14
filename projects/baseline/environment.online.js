
import config from './environment';
const { getEnvironmentName } = require('tnp-bundle');

config.productionBuild = true;
config.name = getEnvironmentName(__filename)


export default Object.freeze(config);

