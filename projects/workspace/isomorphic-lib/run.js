const util = require('util');
const vm = require('vm');

const fse = require('fs-extra');

const ENV = fse.readFileSync('./tmp-environment.json', {
  encoding: 'utf8'
});

const sandbox = {
  animal: 'cat',
  count: 2,
  ENV,
  require,
  global
};

const script = new vm.Script(`
global["ENV"] = JSON.parse(ENV);
var app = require("./dist/index").default;
app();
`);

const context = vm.createContext(sandbox);
script.runInContext(context);
