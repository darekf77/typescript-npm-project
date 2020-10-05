//#region @backend
// console.log('-- FIREDEV started... please wait. --')
// require('cache-require-paths');
Error.stackTraceLimit = 100;
// console.log(global.i0);
// process.exit(0)
global.i0 = {
  defineInjectable: function() {}
}

global.hideLog = true;
global.verboseLevel = 0;
global.globalSystemToolMode = true;

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

var verboseLevel = process.argv.find(a => a.startsWith('-verbose='));
if (typeof verboseLevel !== 'undefined') {
  global.hideLog = false;
  verboseLevel = Number(verboseLevel);
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
