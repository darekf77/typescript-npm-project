
import config from './environment';
import { name } from './environment';

config.productionBuild = true;
config.name = name(__filename)
config.db.logging = false
config.db.dropSchema = false


export default config;
