
import config from './environment';
import { name } from './environment';

config.productionBuild = true;
config.name = name(__filename)


export default Object.freeze(config);
