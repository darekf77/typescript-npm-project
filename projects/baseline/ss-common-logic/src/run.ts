//#region @backend
import * as path from 'path';
import { Controllers, Entities } from "./index";
import mocks from "./db-mocks";
import { start } from './helpers';
import './environment';

console.log('ENV', ENV)


const packageName = path.basename(path.resolve(path.join(__dirname, '..')));

start({
  config: ENV.db as any,
  host: ENV.host(packageName),
  Controllers: Controllers as any,
  Entities: Entities as any,
  MockData: mocks as any
});
//#endregion
