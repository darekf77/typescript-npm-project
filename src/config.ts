import * as _ from 'lodash';
import * as path from 'path';

import { Models } from './models';

const allowedEnvironments: Models.env.EnvironmentName[] = ['static', 'dev', 'prod', 'stage', 'online', 'test'];
const allowedEnvironmentsObj = {};
allowedEnvironments.forEach(s => {
  allowedEnvironmentsObj[s] = s
})
// let { environmentName, env }: { environmentName: EnvironmentName, env: EnvironmentName } = require('minimist')(process.argv);

// if (_.isString(env)) {
//   environmentName = env;
// }

// environmentName = _.isString(environmentName) && environmentName.toLowerCase() as any;
// environmentName = allowedEnvironments.includes(environmentName) ? environmentName : 'local';
// console.log(`Current environment prefix: "${environmentName}"  , args: ${JSON.stringify(process.argv)}`);
const filesNotAllowedToClen = {
  _gitignore: '.gitignore',
  tslint_json: 'tslint.json',
  _editorconfig: '.editorconfig'
}

const file = {
  autob_actions_js: 'auto-actions.js',
  package_json: 'package.json',
  yarn_lock: 'yarn.lock',
  package_lock_json: 'package-lock.json',
  tnpBundle: 'tnp-bundle',
  tnpEnvironment_json: 'tmp-environment.json',
  environment: 'environment',
  tnp_system_path_txt: 'tnp-system-path.txt',
  tmp_transaction_pid_txt: 'tmp-transaction-pid.txt',
  tmp_db_tests_json: 'tmp-db-tests.json',
  ...filesNotAllowedToClen
};

const tempFolders = {
  bundle: 'bundle',
  vendor: 'vendor',
  dist: 'dist',
  tmp: 'tmp',
  tempSrc: 'tmp-src',
  previewDistApp: 'dist-app',
  browser: 'browser',
  module: 'module',
  backup: 'backup',
  node_modules: 'node_modules',
  client: 'client',
  tnp_tests_context: 'tmp-tests-context',
}

const folder = {
  scripts: 'scripts',
  bower: 'bower',
  src: 'src',
  custom: 'custom',
  components: 'components',
  assets: 'assets',
  apps: 'apps',
  // entities: 'entities',
  // controllers: 'controllers',
  projects: 'projects',
  workspace: 'workspace',
  container: 'container',
  bin: 'bin',
  _bin: '.bin',
  tnp_db_for_tests_json: 'db-for-tests.json',
  ...tempFolders
};

function pathResolved(...partOfPath: string[]) {
  return path.resolve(path.join(...partOfPath))
}

const moduleNameAngularLib = [
  folder.components,
  folder.module,
  folder.dist,
  folder.browser,
];

const moduleNameIsomorphicLib = [
  folder.src,
  folder.dist,
  folder.browser,
];

export const config = {
  CONST: {
    TEST_TIMEOUT: 3600000
  },
  debug: {
    sourceModifier: [

    ],
    baselineSiteJoin: {
      DEBUG_PATHES: [
        // '/src/app/+preview-components/preview-components.component.ts',
        // '/src/controllers.ts',
        // '/src/app/+preview-components/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts'
      ],
      DEBUG_MERGE_PATHES: [
        // '/src/app/+preview-components/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts'
        // '/components/formly/base-components/editor/editor-wrapper.component.ts'
        // '/src/app/+preview-components/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts'
      ]
    }
  },
  tnp: 'tnp',
  frameworks: ['bootstrap', 'ionic', 'material'] as Models.env.UIFramework[],
  pathes: {

    tnp_folder_location: pathResolved(__dirname, '..'),
    tnp_vscode_ext_location: pathResolved(__dirname, '..', 'plugins', 'tnp-vscode-ext'),

    tnp_system_path_txt: pathResolved(__dirname, '..', file.tnp_system_path_txt),
    tnp_system_path_txt_tnp_bundle: pathResolved(__dirname, '..', file.tnpBundle, file.tnp_system_path_txt),

    tmp_transaction_pid_txt: pathResolved(__dirname, '..', file.tmp_transaction_pid_txt),
    tmp_db_tests_json: pathResolved(__dirname, '..', file.tmp_db_tests_json),

    tnp_tests_context: pathResolved(`/tmp/tnp/${folder.tnp_tests_context}`),
    tnp_db_for_tests_json: pathResolved(__dirname, '..', folder.bin, folder.tnp_db_for_tests_json),

    bin_in_node_modules: pathResolved(__dirname, '..', folder.node_modules, folder._bin),

    scripts: {
      HELP_js: pathResolved(__dirname, folder.scripts, 'HELP.js'),
      allHelpFiles: path.join(__dirname, folder.scripts, '/**/*.js'),
      allPattern: path.join(__dirname, `/${folder.scripts}/**/*.js`),
    },

    projectsExamples: {
      workspace: pathResolved(__dirname, `../projects/container/workspace`),
      container: pathResolved(__dirname, `../projects/container`)
    }
  },
  allowedEnvironments,
  folder,
  tempFolders,
  filesNotAllowedToClen: Object.keys(filesNotAllowedToClen).map(key => filesNotAllowedToClen[key]) as string[],
  file,
  default: {
    cloud: {
      environment: {
        name: 'online' as Models.env.EnvironmentName
      }
    }
  },
  message: {
    tnp_normal_mode: 'tnp_normal_mode'
  },
  names: {
    env: allowedEnvironmentsObj
  },
  extensions: {
    /**
       * Modify source: import,export, requires
       */
    get modificableByReplaceFn() {
      return [
        'ts',
        'js',
        'css',
        'sass',
        'scss',
        'less',
      ].map(f => `.${f}`)
    },
  },
  // fileExtensionsText: [
  //   'js',
  //   'ts',
  //   'txt',
  //   'json',
  //   'doc',
  //   'rtf',
  //   'md',
  //   'sh'
  // ].map(f => `.${f}`),
  allowedTypes: {
    angularClient: [
      'angular-cli',
      'angular-client',
      'angular-lib',
      'ionic-client',
    ] as Models.libs.LibType[],
    app: [
      'angular-cli',
      'angular-client',
      'angular-lib',
      'isomorphic-lib',
      'ionic-client',
      'docker',
      'container'
    ] as Models.libs.LibType[],
    libs: [
      'angular-lib',
      'isomorphic-lib',
      'server-lib',
      'workspace'
    ] as Models.libs.LibType[]
  },
  moduleNameAngularLib,
  moduleNameIsomorphicLib,
  filesExtensions: {
    filetemplate: 'filetemplate'
  },
  appTypes: [
    'angular-client',
    'angular-lib',
    'ionic-client'
  ] as Models.libs.LibType[],
  libsTypes: [
    'workspace',
    'docker',
    'server-lib',
    'isomorphic-lib',
    'angular-lib',
    'angular-client',
    'angular-cli'
  ] as Models.libs.LibType[],
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
      { name: 'extract-zip', version: '1.6.7' },
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
      { name: 'stmux' },
      { name: 'webpack-bundle-analyzer' },
    ],
    programs: [
      //   {
      //     name: 'code',
      //     website: 'https://code.visualstudio.com/'
      //   }
    ]
  }
}

