//#region @backend
// console.log('-- FIREDEV started... please wait. --')
// require('cache-require-paths');
Error.stackTraceLimit = 100;
// console.log(global.i0);
// process.exit(0)

// TODO QUIK_FIX
global.i0 = {
  defineInjectable: function () { }
}

global.globalSystemToolMode = true;

if (process.argv.find((a, i) => {
  if (a.startsWith('-installintnp') || a.startsWith('-iintnp')) {
    installInTnp(process.argv.slice(i + 1));
  }
})) {

}

var frameworkName = process.argv.find(a => a.startsWith('-firedev'));
if (typeof frameworkName !== 'undefined') {
  global.frameworkName = 'firedev';
}

var reinitDb = false;
var reinitDb = process.argv.find(a => a.startsWith('-reinitDb'));
if (typeof reinitDb !== 'undefined') {
  global.reinitDb = true;
}

global.restartWorker = false;
var restartWorkerString = process.argv.find(a => a.startsWith('-restartWorker'));
if (typeof restartWorkerString !== 'undefined') {
  global.restartWorker = true;
}

global.useWorker = true;
var useWorker = process.argv.find(a => a.startsWith('-useWorker'));
if (typeof useWorker !== 'undefined') {
  var useWorkerArr = useWorker.split('=');
  if (useWorkerArr.length === 2) {
    if (useWorkerArr[1] === 'false') {
      global.useWorker = false;
    } else {
      global.useWorker = true;
    }
  } else {
    global.useWorker = true;
  }
}

global.hideLog = true;
global.verboseLevel = 0;
var verboseLevel = process.argv.find(a => a.startsWith('-verbose='));
if (typeof verboseLevel !== 'undefined') {
  global.hideLog = false;
  verboseLevel = Number(verboseLevel.replace('-verbose=', ''));
  if (!isNaN(verboseLevel)) {
    global.verboseLevel = verboseLevel;
  }
  process.argv = process.argv.filter(a => !a.startsWith('-verbose='));
}

if (process.argv.includes('-verbose')) {
  global.hideLog = false;
  process.argv = process.argv.filter(a => a !== '-verbose');
}
var mode;
var distOnly = (process.argv.includes('-dist'));
var bundleOnly = (process.argv.includes('-bundle'));
var npmOnly = (process.argv.includes('-npm'));
if (distOnly) {
  mode = 'dist';
  !global.hideLog && console.log('- dist only -');
  // =========================== only dist ============================
  process.argv = process.argv.filter(a => a !== '-dist');
  process.argv = process.argv.filter(f => !!f);
  var path = require('path');
  var pathToDistRun = path.join(__dirname, '../dist/index.js');
  var start = require(pathToDistRun.replace(/\.js$/g, '')).start;

  // =======================================================================
} else if (bundleOnly) {
  mode = 'bundle';
  !global.hideLog && console.log('- bundle only -');
  // =========================== only dist ============================
  process.argv = process.argv.filter(a => a !== '-bundle');
  process.argv = process.argv.filter(f => !!f);
  var path = require('path');
  var pathToDistRun = path.join(__dirname, '../bundle/index.js');
  var start = require(pathToDistRun.replace(/\.js$/g, '')).start;

  // =======================================================================
} else if (npmOnly) {
  mode = 'npm';
  !global.hideLog && console.log('- npm global only -');
  // =========================== only dist ============================
  process.argv = process.argv.filter(a => a !== '-npm');
  process.argv = process.argv.filter(f => !!f);
  var path = require('path');
  var pathToDistRun = path.join(__dirname, '../index.js');
  var start = require(pathToDistRun.replace(/\.js$/g, '')).start;

} else {
  // =========================== TODO speeding up! ============================
  var fs = require('fs');
  var path = require('path');
  var ora = require('ora');
  var spinner = ora();

  global.spinner = spinner;
  // if (!isNaN(process.ppid)) {
  //   spinner.start();
  // }
  var pathToDistFolder = path.join(__dirname, '../dist');
  var pathToBundleFolder = path.join(__dirname, '../bundle');

  var pathToDistRun = path.join(__dirname, '../dist/index.js');
  var pathToBundletRun = path.join(__dirname, '../bundle/index.js');
  var pathToIndexRun = path.join(__dirname, '../index.js');

  var distExist = fs.existsSync(pathToDistRun);
  var bundleExist = fs.existsSync(pathToBundletRun);

  var start;

  if (bundleExist && distExist) {
    if (fs.lstatSync(pathToDistFolder).mtimeMs > fs.lstatSync(pathToBundleFolder).mtimeMs) {
      mode = 'dist';
      !global.hideLog && console.log('- firedev dist -> becouse is newer -');
      start = require(pathToDistRun.replace(/\.js$/g, '')).start;
    } else {
      mode = 'bundle';
      !global.hideLog && console.log('- firedev bundle -> becouse is newer -');
      start = require(pathToBundletRun.replace(/\.js$/g, '')).start;
    }
  } else {
    if (distExist) {
      mode = 'dist';
      !global.hideLog && console.log('- firedev dist -');
      start = require(pathToDistRun.replace(/\.js$/g, '')).start;
    } else if (bundleExist) {
      mode = 'bundle';
      !global.hideLog && console.log('- firedev bundle -');
      start = require(pathToBundletRun.replace(/\.js$/g, '')).start;
    } else {
      mode = 'npm';
      !global.hideLog && console.log('- npm mode -');
      start = require(pathToIndexRun.replace(/\.js$/g, '')).start;
    }
  }
  // =======================================================================
}
global.start = start;
global.frameworkMode = mode;
// console.log('before start')
start(process.argv, 'tnp', mode);
//#endregion

function installInTnp(arr = []) {
  arr.push('tnp')
  const path = require('path');
  const child_process = require('child_process');
  const fse = require('fs-extra');
  const rimraf = require('rimraf');
  fse.readlinkSync
  const projectName = path.basename(process.cwd());
  for (let index = 0; index < arr.length; index++) {
    const proj = arr[index];
    if (proj === projectName) {
      console.log(`Ommiting ${proj}`)
      continue;
    }
    if (!fse.existsSync(`./dist`)) {
      fse.mkdirpSync('./dist');
    }
    if (proj !== 'tnp') {
      try {
        const linkP = fse.readlinkSync(`./node_modules`);
        if((typeof linkP === 'string') && crossPlatofrmPath(linkP).endsWith('/tnp/node_modules') ) {
          console.info(`DONE already linked tnp/node_modules for (${proj})..`);
          continue;
        }
      } catch (error) {}
    }
    
    if (proj !== 'tnp') {
      try {
        rimraf.sync('./node_modules')
        child_process.execSync('lnk ../tnp/node_modules ./', { cwd: process.cwd() });
        console.info(`DONE Link only (${proj})..`);
        continue;
      } catch (error) {
        console.error(`Not able to link in ${proj}`)
      }
    }
    
    child_process.execSync(`rimraf ../${proj}/node_modules/${projectName} && lnk ./dist/ ../${proj}/node_modules/${projectName} && lnk ./src/ ../${proj}/node_modules/${projectName}`, { cwd: process.cwd() });
    fse.writeFileSync(`../${proj}/node_modules/${projectName}/index.js`, `
    "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  var tslib_1 = require("tslib");
  tslib_1.__exportStar(require("./dist"), exports);
   
    `)
    fse.writeFileSync(`../${proj}/node_modules/${projectName}/index.d.ts`, `
    export * from './src';
    `)
    fse.writeFileSync(`./tsconfig.json`,tsconfig())
  fse.writeFileSync(`./tsconfig.isomorphic.json`,tsconfigIso())
    console.info(`DONE all for ${proj}`)
  }
  

  console.info(`DONE`)
  process.exit(0)
}


function crossPlatofrmPath(p) {

  // const isExtendedLengthPath = /^\\\\\?\\/.test(p);
  // const hasNonAscii = /[^\u0000-\u0080]+/.test(p); // eslint-disable-line no-control-regex

  // if (isExtendedLengthPath || hasNonAscii) {
  //   return p;
  // }

  // return path.replace(/\\/g, '/');

  if (process.platform === 'win32') {
    return p.replace(/\\/g, '/');
  }
  return p;
}




function tsconfig() {
  return `
  {
    "extends": "./tsconfig.isomorphic.json",
    "compilerOptions": {
        "rootDir": "./src"
    },
    "include": [
        "src/**/*"
    ]
}

  `
}

function tsconfigIso() {
  return `
  {
    "compileOnSave": true,
    "compilerOptions": {
      "declaration": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
      "allowSyntheticDefaultImports": true,
      "importHelpers": true,
      "moduleResolution": "node",
      "module": "commonjs",
      "skipLibCheck": true,
      "sourceMap": true,
      "target": "es5",
      "typeRoots": [
        "node_modules/@types"
      ],
      "lib": [
        "es2015",
        "es2015.promise",
        "es2015.generator",
        "es2015.collection",
        "es2015.core",
        "es2015.reflect",
        "es2016",
        "dom"
      ],
      "types": [
        "node"
      ],
      "rootDir": "./tmp-src",
      "outDir": "dist"
    },
    "include": [
      "tmp-src/**/*"
    ],
    "exclude": [
      "node_modules",
      "preview",
      "projects",
      "docs",
      "dist",
      "bundle",
      "example",
      "examples",
      "browser",
      "module",
      "tmp-src",
      "src/tests",
      "src/**/*.spec.ts",
      "tmp-site-src",
      "tmp-tests-context"
    ]
  }
  

  `
}