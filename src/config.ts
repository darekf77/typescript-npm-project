import * as _ from 'lodash';


import { LibType, EnvironmentName } from './models';

const allowedEnvironments: EnvironmentName[] = ['dev', 'prod', 'stage', 'online', 'test'];
// let { environmentName, env }: { environmentName: EnvironmentName, env: EnvironmentName } = require('minimist')(process.argv);

// if (_.isString(env)) {
//   environmentName = env;
// }

// environmentName = _.isString(environmentName) && environmentName.toLowerCase() as any;
// environmentName = allowedEnvironments.includes(environmentName) ? environmentName : 'local';
// console.log(`Current environment prefix: "${environmentName}"  , args: ${JSON.stringify(process.argv)}`);

export const config = {
  tnp: 'tnp',
  allowedEnvironments,
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
    projects: 'projects',
    workspace: 'workspace',
    client: 'client'

  },
  file: {
    package_json: 'package.json',
    tnpBundle: 'tnp-bundle',
    tnpEnvironment_json: 'tmp-environment.json',
    environment: 'environment',
    bin: 'bin'
  },
  default: {
    cloud: {
      environment: {
        name: 'online' as EnvironmentName
      }
    }
  },
  names: {
    env: {
      prod: 'prod',
      dev: 'dev',
      stage: 'stage',
      local: 'local'
    }
  },
  allowedTypes: {
    app: [
      'angular-cli',
      'angular-client',
      'angular-lib',
      'isomorphic-lib',
      'ionic-client',
      'docker'
    ] as LibType[],
    libs: [
      'angular-lib',
      'isomorphic-lib',
      'server-lib',
      'workspace'
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
  // environmentName
}


export default config;
