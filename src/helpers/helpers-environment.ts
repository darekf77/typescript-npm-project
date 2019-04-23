//#region @backend
import * as fse from 'fs-extra';


const path = require('path');

function environmentName(filename, local_env_name) {
  let name = path.basename(filename)
  name = name.replace(/\.js$/, '')
  name = name.replace('environment', '')
  name = name.replace(/\./g, '');
  return name === '' ? local_env_name : name
}
//#endregion

export function isValidIp(ip:string) {
  if(ip === 'localhost') {
    return true;
  }
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)
}
