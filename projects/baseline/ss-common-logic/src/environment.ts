//#region @backend
import * as path from 'path';
import * as fs from 'fs';

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


export default config;
//#endregion
