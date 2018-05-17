import * as fse from 'fs-extra';

fse.readJSONSync('asd')

const path = require('path');

function environmentName(filename, local_env_name) {
  let name = path.basename(filename)
  name = name.replace(/\.js$/, '')
  name = name.replace('environment', '')
  name = name.replace(/\./g, '');
  return name === '' ? local_env_name : name
}

