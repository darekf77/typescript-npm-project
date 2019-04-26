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
  CONST: {
    TEST_TIMEOUT: 3600000
  },
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
    apps: 'apps',
    // entities: 'entities',
    // controllers: 'controllers',
    projects: 'projects',
    workspace: 'workspace',
    container: 'container',
    client: 'client',
    bin: 'bin',
    _bin: '.bin',
    tnp_tests_context: 'tmp-tests-context',
    tnp_db_for_tests_json: 'db-for-tests.json'
  },
  file: {
    autob_actions_js: 'auto-actions.js',
    package_json: 'package.json',
    tnpBundle: 'tnp-bundle',
    tnpEnvironment_json: 'tmp-environment.json',
    environment: 'environment',
    tnp_system_path_txt: 'tnp-system-path.txt'
  },
  default: {
    cloud: {
      environment: {
        name: 'online' as EnvironmentName
      }
    }
  },
  message: {
    tnp_normal_mode: 'tnp_normal_mode'
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
      'docker',
      'container'
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
  // environmentName,
  localLibs: [
    'eslint',
    'mkdirp',
    'gulp',
    'npm-run',
    'rimraf',
    'nodemon',
    'release-it',
    'tsc',
    'watch',
    'http-server',
    'ts-node',
    'sort-package-json',
    'concurrently',
    'sloc',
    'morphi'
  ],
  helpAlias: [
    '-h',
    '--help',
    '-help',
    'help'
  ],
  required: {
    npm: [
      { name: 'watch', version: '1.0.2' },
      { name: 'check-node-version' },
      { name: 'npm-run', version: '4.1.2' },
      { name: 'rimraf' },
      { name: 'mkdirp' },
      { name: 'renamer' },
      { name: 'nodemon' },
      { name: 'madge' },
      { name: 'http-server' },
      { name: 'increase-memory-limit' },
      { name: 'bower' },
      { name: 'fkill', installName: 'fkill-cli' },
      { name: 'mocha' },
      // { name: 'chai' },
      { name: 'ts-node' },
      { name: 'stmux' }
    ],
    programs: [
      //   {
      //     name: 'code',
      //     website: 'https://code.visualstudio.com/'
      //   }
    ]
  }
}


export default config;
