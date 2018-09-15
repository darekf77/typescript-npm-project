import * as _ from 'lodash';


import { LibType, EnvironmentName } from './models';

export const allowedEnvironments: EnvironmentName[] = ['dev', 'prod', 'stage', 'online'];
let { env }: { env: EnvironmentName } = require('minimist')(process.argv);

env = allowedEnvironments.includes(env) ? `.${env}` : '' as any;
console.log(`Current environment prefix: "${env}"  , args: ${JSON.stringify(process.argv)}`);

export const config = {
  tnp: 'tnp',
  folder: {
    bundle: 'bundle',
    bower: 'bower',
    vendor: 'vendor',
    dist: 'dist',
    src: 'src',
    tempSrc: 'tmp-src',
    previewDistApp: 'dist-app',
    browser: 'browser',
    module: 'module',
    custom: 'custom',
    components: 'components',
    node_modules: 'node_modules',
    assets: 'assets',
    entities: 'entities',
    controllers: 'controllers',

  },
  file: {
    package_json: 'package.json',
    tnpBundle: 'tnp-bundle'
  },
  allowedTypes: {
    app: [
      'angular-cli',
      'angular-client',
      'angular-lib',
      'ionic-client',
      'docker',
      'workspace'
    ] as LibType[],
    libs: [
      'angular-lib',
      'isomorphic-lib',
      'server-lib'
    ] as LibType[]
  },
  libsTypes: [
    'workspace',
    'docker',
    'server-lib',
    'isomorphic-lib',
    'angular-lib',
    'angular-client',
    'angular-cli'
  ] as LibType[],
  env
}


export default config;
