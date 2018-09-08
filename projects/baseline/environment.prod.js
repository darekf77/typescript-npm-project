
import config from './environment';
const { getEnvironmentName } = require('tnp-bundle');

console.log('production config')
config.productionBuild = true;
config.name = getEnvironmentName(__filename)


export default Object.freeze(config);
