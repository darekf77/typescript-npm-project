//#region @backend
import * as path from 'path';
import { Controllers, Entities } from "./index";
import mocks from "./db-mocks";
import { start } from './helpers';
import config from './environment';

const packageName = path.basename(path.resolve(path.join(__dirname, '..')));

start({
  config: config.db as any,
  host: config.host(packageName),
  Controllers: Controllers as any,
  Entities: Entities as any,
  MockData: mocks as any
});
//#endregion
