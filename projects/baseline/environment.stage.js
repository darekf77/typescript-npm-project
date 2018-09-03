
import config from './environment';
const { getEnvironmentName, LOCAL_ENVIRONMENT_NAME, gethost } = require('tnp-helpers');

config.productionBuild = true;
config.name = getEnvironmentName(__filename)


export default Object.freeze(config);
