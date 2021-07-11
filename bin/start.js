
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

let orgArgv = JSON.parse(JSON.stringify(process.argv));
const tnpNonInteractive = process.argv.find(a => a.startsWith('--tnpNonInteractive'));

global.globalSystemToolMode = true;

if (process.argv.find((a, i) => {
  if (a.startsWith('-manuallink')) {
    installInTnp(process.argv.slice(i + 1));
  }
  if (a.startsWith('-removelinks')) {
    removeLinks(process.argv.slice(i + 1));
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

global.start = start;
global.frameworkMode = mode;

var spinnerIsDefault = !tnpNonInteractive;
// var spinnerIsDefault = false;
 // TODO ther is issue with double '-' when executing child process
var startSpinner = spinnerIsDefault ?
  (!process.argv.includes('-spinner'))
  : process.argv.includes('-spinner');
var isNodeDebuggerEnabled = false;
if (startSpinner) {
  const inspector = require('inspector');
  isNodeDebuggerEnabled = (inspector.url() !== undefined);
  startSpinner = !isNodeDebuggerEnabled;
}
if(startSpinner && isNaN(process.ppid)) {
  startSpinner = false;
}

if (startSpinner) {
  var ora = require('ora');
  var spinner = ora();
  spinner.start();
  // process.on('message', message => {

  // });
} else {
  global.spinner = {
    start() {
      process.send && process.send('start-spinner')
    },
    stop() {
      process.send && process.send('stop-spinner')
    }
  }
  process.on("SIGINT", function () {
    process.exit(1);
  });
}
process.argv = process.argv.filter(a => a !== '-spinner');
process.argv = process.argv.filter(f => !!f);

if (startSpinner) {
  //#region spinner
  spinner.start();
  const spawn = require('cross-spawn');
  // const child_process = require('child_process')
  orgArgv = orgArgv.filter(a => a !== '-spinner');
  // var start = new Date();
  const env = {
    ...process.env,
    FORCE_COLOR: '1'
  };


  const command = `${!!frameworkName ? frameworkName : 'tnp'}${isNodeDebuggerEnabled ? '-debug' : ''}`;
  const argsToCHildProc = `${orgArgv.slice(2).join(' ')} ${spinnerIsDefault ? '-spinner' : ''}`.split(' ');
  // !global.hideLog && console.log(`worker command: ${command} ${argsToCHildProc.join(' ')}`);
  const proc = spawn(command,
    argsToCHildProc
    , {
      env,
      stdio: [0, 1, 2, 'ipc'],
      cwd: process.cwd(),
    });
  proc.on('message', message => {
    if (message === 'start-spinner') {
      spinner.start();
    }
    if (message === 'stop-spinner') {
      spinner.stop();
    }
  });
  // process.stdin.pipe(proc.stdin);
  // proc.stdin.setEncoding = 'utf-8';
  // proc.stdout.pipe(process.stdout);
  // proc.stdio = [0, 1, 2];
  // proc.stdout.on('data', (data) => {
  //   process.stdout.write(data)
  // })
  // proc.stdout.on('error', (data) => {
  //   process.stderr.write(data);
  // })
  // proc.stderr.on('data', (data) => {
  //   process.stderr.write(data)
  // })
  // proc.stderr.on('error', (data) => {
  //   process.stderr.write(data);
  // })
  proc.on('exit', (code) => {
    // const end = new Date() - start
    // console.info('Execution time: %dms', end)
    process.exit(code);
  })
  //#endregion
  // process.stdin.resume();
} else {
  //#region mode
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
    var fs = require('fs');
    var path = require('path');

    //#region choose right version of js to run
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
        // TOOOO MUCH TIME !!!!!!
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

    //#endregion
  }
  //#endregion
  start(process.argv, 'tnp', mode, !!spinner ? spinner : void 0);
}

//#region manula linking
function installInTnp() {

  const path = require('path');
  const child_process = require('child_process');
  const fse = require('fs-extra');
  const rimraf = require('rimraf');
  const { Helpers } = require('tnp-core');

  const parentPath = path.join(process.cwd());
  const tnpNodeModulesPath = path.join(parentPath, 'tnp', 'node_modules');
  try {
    var projType = fse.readJSONSync(path.join(parentPath, 'package.json'), { encoding: 'utf8' }).tnp.type;
  } catch (error) {
    console.error('This is not tnp type project')
    process.exit(1)
  }

  if (projType !== 'container') {
    console.error('Manual linking only for container')
    process.exit(1)
  }
  const allProjects = fse.readdirSync(parentPath)
    .filter(f => fse.lstatSync(path.join(parentPath, f)).isDirectory() && !f.startsWith('tmp'))
    .filter(f => !['.git', 'tnp', 'node_modules', 'src', '.vscode'].includes(f))

  for (let i = 0; i < allProjects.length; i++) {
    const currentProjectName = allProjects[i];

    const nodeModulesPath = path.join(parentPath, currentProjectName, 'node_modules');

    let isLinked = false;
    try {
      const linkP = fse.readlinkSync(nodeModulesPath);
      if ((typeof linkP === 'string') && crossPlatofrmPath(linkP).endsWith('/tnp/node_modules')) {
        console.info(`DONE already linked tnp/node_modules for (${currentProjectName})..`);
        isLinked = true;
      }
    } catch (error) { }

    if (!isLinked) {
      try {
        rimraf.sync(nodeModulesPath)
        Helpers.createSymLink(tnpNodeModulesPath, nodeModulesPath)
        console.info(`DONE Link only (${currentProjectName})..`);
      } catch (error) {
        console.error(`Not able to link in ${currentProjectName}`);
        process.exit(0)
      }
    }

    const tsconfigPath = path.join(parentPath, currentProjectName, 'tsconfig.json')
    fse.writeFileSync(tsconfigPath, tsconfig())

    // const tsconfigIsomorphicPath = path.join(parentPath, currentProjectName, 'tsconfig.json')
    // fse.writeFileSync(tsconfigIsomorphicPath, tsconfigIso())

    const distPath = path.join(parentPath, currentProjectName, 'dist')
    const srcPath = path.join(parentPath, currentProjectName, 'src')
    if (!fse.existsSync(distPath)) {
      fse.mkdirpSync(distPath);
    }

    const destinationPath = path.join(parentPath, 'tnp', 'node_modules');
    rimraf.sync(path.join(destinationPath, currentProjectName));

    fse.existsSync(distPath) && Helpers.createSymLink(distPath, path.join(destinationPath, currentProjectName, 'dist'));
    fse.existsSync(srcPath) && Helpers.createSymLink(srcPath, path.join(destinationPath, currentProjectName, 'src'));

    const indexPath = path.join(destinationPath, currentProjectName, 'index.js')

    fse.writeFileSync(indexPath, `
    "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  var tslib_1 = require("tslib");
  tslib_1.__exportStar(require("./dist"), exports);

    `)

    const indexDtsPath = path.join(destinationPath, currentProjectName, 'index.d.ts')
    fse.writeFileSync(indexDtsPath, `
    export * from './src';
    `)

    const pacakgeJsonSource = path.join(parentPath, currentProjectName, 'package.json');
    const pacakgeJsonDestLink = path.join(destinationPath, currentProjectName, 'package.json');
    Helpers.createSymLink(pacakgeJsonSource, pacakgeJsonDestLink)


    console.info(`DONE all for ${currentProjectName}`)

  }

  console.info(`DONE`)
  process.exit(0)
}
//#endregion

//#region templates
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
      "outDir": "dist"
    },
    "include": [
      "src/"
    ]
  }

  `
}


function removeLinks() {

  const path = require('path');
  const parentPath = path.join(process.cwd());
  const fse = require('fs-extra');
  const rimraf = require('rimraf');
  fse.readdirSync(parentPath)
    .filter(f => fse.lstatSync(path.join(parentPath, f)).isDirectory() && !f.startsWith('tmp'))
    .filter(f => !['.git', 'tnp', 'node_modules', 'src', '.vscode'].includes(f))
    .map(f => path.join(f, 'node_modules'))
    .filter(f => fse.existsSync(f) && fse.lstatSync(f).isSymbolicLink())
    .filter(f => rimraf.sync(f))
  console.info(`DONE`);
  process.exit(0)
}
//#endregion

//#endregion
