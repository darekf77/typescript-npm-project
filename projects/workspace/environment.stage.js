
import config from './environment.prod';
import { name } from './environment';

config.name = name(__filename)

export default Object.freeze(config);
