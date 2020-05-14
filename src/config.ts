import * as _ from 'lodash';
//#region @backend
import * as path from 'path';
//#endregion
import { Helpers } from 'ng2-logger';

import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';

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
const filesNotAllowedToClean = {
  _gitignore: '.gitignore',
  _npmrc: '.npmrc',
  tslint_json: 'tslint.json',
  _editorconfig: '.editorconfig',
  _angularCli_json: '.angular-cli.json',
  _vscode_launch_json: '.vscode/launch.json',
}

const file = {
  controllers_ts: 'controllers.ts',
  entities_ts: 'entities.ts',
  autob_actions_js: 'auto-actions.js',
  package_json: 'package.json',
  yarn_lock: 'yarn.lock',
  package_lock_json: 'package-lock.json',
  tnpBundle: 'tnp-bundle',
  tnpEnvironment_json: 'tmp-environment.json',
  environment: 'environment',
  environment_js: 'environment.js',
  tnp_system_path_txt: 'tnp-system-path.txt',
  tmp_transaction_pid_txt: 'tmp-transaction-pid.txt',
  manifest_webmanifest: 'manifest.webmanifest',
  publicApi_ts: 'public_api.ts',
  _babelrc: '.babelrc',
  ...filesNotAllowedToClean
};

const tempFolders = {
  bundle: 'bundle',
  vendor: 'vendor',
  docs: 'docs',
  dist: 'dist',
  tmp: 'tmp',
  tempSrc: 'tmp-src',
  previewDistApp: 'dist-app',
  preview: 'preview',
  browser: 'browser',
  module: 'module',
  backup: 'backup',
  node_modules: 'node_modules',
  client: 'client',
  tnp_tests_context: 'tmp-tests-context',
  tmpPackage: 'tmp-package'
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
  // projects: 'projects',
  workspace: 'workspace',
  container: 'container',
  bin: 'bin',
  _bin: '.bin',
  tnp_db_for_tests_json: 'db-for-tests.json',
  ...tempFolders
};

//#region @backend
function pathResolved(...partOfPath: string[]) {
  return path.resolve(path.join(...partOfPath))
}
//#endregion

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
  //#region @backend
  get dbLocation() {
    let dbPath = `bin/db.json`;
    if (global.testMode) {
      dbPath = `bin/${config.folder.tnp_db_for_tests_json}`;
    }
    const Project = CLASS.getBy('Project') as any;
    const location = path.join(Project.Tnp.location, dbPath);
    return location;
  },
  //#endregion
  regexString: {
    pathPartStringRegex: `(\/([a-zA-Z0-9]|\\-|\\_|\\+|\\.)*)`
  },
  placeholders: {
    forProjectsInEnvironmentFile: '//<PLACEHOLDER_FOR_PROJECTS>'
  },
  defaultFrameworkVersion: 'v1' as ('v1' | 'v2'),
  CONST: {
    TEST_TIMEOUT: 3600000
  },
  debug: {
    sourceModifier: [

    ],
    baselineSiteJoin: {
      DEBUG_PATHES: [
        // "src/apps/auth/AuthController.ts",
        // '/src/app/+preview-components/preview-components.component.ts',
        // '/src/controllers.ts',
        // '/src/app/+preview-components/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts'
      ],
      DEBUG_MERGE_PATHES: [
        // "src/apps/auth/AuthController.ts",
        // '/src/app/+preview-components/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts'
        // '/components/formly/base-components/editor/editor-wrapper.component.ts'
        // '/src/app/+preview-components/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts'
      ]
    }
  },
  frameworkName: 'tnp',
  startPort: 6001,
  frameworks: ['bootstrap', 'ionic', 'material'] as Models.env.UIFramework[],
  //#region @backend
  pathes: {

    logoSvg: 'logo.svg',
    logoPng: 'logo.png',

    tnp_folder_location: pathResolved(__dirname, '..'),
    tnp_vscode_ext_location: pathResolved(__dirname, '../../firedev-projects', 'plugins', 'tnp-vscode-ext'),

    tnp_system_path_txt: pathResolved(__dirname, '..', file.tnp_system_path_txt),
    tnp_system_path_txt_tnp_bundle: pathResolved(__dirname, '..', file.tnpBundle, file.tnp_system_path_txt),

    tmp_transaction_pid_txt: pathResolved(__dirname, '..', file.tmp_transaction_pid_txt),

    tnp_tests_context: pathResolved(`/tmp/tnp/${folder.tnp_tests_context}`),
    tnp_db_for_tests_json: pathResolved(__dirname, '..', folder.bin, folder.tnp_db_for_tests_json),

    bin_in_node_modules: pathResolved(__dirname, '..', folder.node_modules, folder._bin),

    scripts: {
      HELP_js: pathResolved(__dirname, folder.scripts, 'HELP.js'),
      allHelpFiles: path.join(__dirname, folder.scripts, '/**/*.js'),
      allPattern: path.join(__dirname, `/${folder.scripts}/**/*.js`),
    },

    projectsExamples: (version?: Models.libs.FrameworkVersion) => {
      version = (!version || version === 'v1') ? '' : `-${version}` as any;
      return {
        workspace: pathResolved(__dirname, `../../firedev-projects/container${version}/workspace${version}`),
        container: pathResolved(__dirname, `../../firedev-projects/container${version}`),
        projectByType(libType: Models.libs.NewFactoryType) {
          return pathResolved(__dirname, `../../firedev-projects/container${version}/workspace${version}/${libType}${version}`);
        },
        singlefileproject: pathResolved(__dirname, `../../firedev-projects/single-file-project`)
      }
    }
  },
  //#endregion
  allowedEnvironments,
  folder,
  tempFolders,
  filesNotAllowedToClean: Object.keys(filesNotAllowedToClean).map(key => filesNotAllowedToClean[key]) as string[],
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
    env: allowedEnvironmentsObj,
    baseline: 'baseline'
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
  /**
   * Build allowed types
   */
  allowedTypes: {
    /**
     * Projects for build:app:watch command
     */
    app: [
      Models.libs.GlobalLibTypeName.angularClient,
      Models.libs.GlobalLibTypeName.angularLib,
      Models.libs.GlobalLibTypeName.isomorphicLib,
      Models.libs.GlobalLibTypeName.ionicClient,
      Models.libs.GlobalLibTypeName.docker,
      Models.libs.GlobalLibTypeName.container,
    ] as Models.libs.LibType[],
    /**
     * Projects for build:(dist|bundle):(watch) command
     */
    libs: [
      Models.libs.GlobalLibTypeName.angularLib,
      Models.libs.GlobalLibTypeName.isomorphicLib,
      Models.libs.GlobalLibTypeName.workspace,
      Models.libs.GlobalLibTypeName.container,
    ] as Models.libs.LibType[]
  },
  moduleNameAngularLib,
  moduleNameIsomorphicLib,
  filesExtensions: {
    filetemplate: 'filetemplate'
  },
  projectTypes: {
    forNpmLibs: [
      Models.libs.GlobalLibTypeName.angularLib,
      Models.libs.GlobalLibTypeName.isomorphicLib,
    ],
    with: {
      angularAsCore: [
        Models.libs.GlobalLibTypeName.angularClient,
        Models.libs.GlobalLibTypeName.angularLib,
        Models.libs.GlobalLibTypeName.ionicClient,
      ],
      componetsAsSrc: [
        Models.libs.GlobalLibTypeName.angularLib,
      ],
    }
  },
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
      { name: 'yo' },
      { name: 'mocha' },
      // { name: 'chai' },
      { name: 'ts-node' },
      { name: 'vsce' },
      { name: 'stmux' },
      { name: 'webpack-bundle-analyzer' },
      { name: 'ng', installName: '@angular/cli' },
      { name: 'ngx-pwa-icons', version: '0.1.2' },
      { name: 'real-favicon', installName: 'cli-real-favicon' },
      { name: 'babel', installName: 'babel-cli' },
      { name: 'javascript-obfuscator' },
      { name: 'uglifyjs', installName: 'uglify-js' },
    ],
    niceTools: [
      { name: 'speed-test' },
      { name: 'npm-name' }, // check if name is available on npm
      { name: 'vantage', platform: 'linux' }, // inspect you live applicaiton
      { name: 'clinic', platform: 'linux' }, // check why nodejs is slow
      { name: 'vtop', platform: 'linux' }, // inspect you live applicaiton,
      { name: 'public-ip' },
      { name: 'empty-trash' },
      { name: 'is-up' }, // check if website is ok
      { name: 'is-online' }, // check if internet is ok,
      { name: 'ttystudio' }, // record terminal actions,
      { name: 'bcat' }, // redirect any stream to browser,
      { name: 'wifi-password', installName: 'wifi-password-cli' },
      { name: 'wallpaper', installName: 'wallpaper-cli' },
      { name: 'brightness', installName: 'brightness-cli' },
      { name: 'subdownloader' },
      { name: 'rtail' }, // monitor multiple server
      { name: 'iponmap' }, // show ip in terminal map,
      { name: 'jsome' }, // display colored jsons,
      { name: 'drawille', isNotCli: true }, // 3d drwa in temrinal
      { name: 'columnify', isNotCli: true }, // draw nice columns in node,
      { name: 'multispinner', isNotCli: true }, // progres for multiple async actions
      { name: 'cfonts' }, // draw super nice fonts in console
    ],
    programs: [,
      //   {
      //     name: 'code',
      //     website: 'https://code.visualstudio.com/'
      //   }
    ]
  }
}



if (Helpers.isNode) {
  //#region @backend
  if (!global['ENV']) {
    global['ENV'] = {};
  }
  global['ENV']['config'] = config;
  //#endregion
} else {
  if (!window['ENV']) {
    window['ENV'] = {};
  }
  window['ENV']['config'] = config;
}

