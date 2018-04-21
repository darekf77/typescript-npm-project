//#region @backend
import { Controllers, Entities } from "./index";
import { start } from './helpers';
import * as path from 'path';
import * as fs from 'fs';
import mocks from "./db-mocks";

if (!process.env.environmentName) {
  process.env.environmentName = ''
}

console.log(process.env)
if (process.env.environmentName !== '') {
  process.env.environmentName = `.${process.env.environmentName}`;
}
const envrionmentFilePath = path.join(__dirname, `../../environment${process.env.environmentName}.js`);
console.log(envrionmentFilePath)
if (!fs.existsSync(envrionmentFilePath)) {
  throw `File "${envrionmentFilePath}" doesn't exist`;
}

let config = require(envrionmentFilePath);
const packageName = path.basename(path.resolve(path.join(__dirname, '..')));

start({
  config: config.db as any,
  host: config.host(packageName),
  Controllers: Controllers as any,
  Entities: Entities as any,
  MockData: mocks as any
});

//#endregion
