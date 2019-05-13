const path = require('path')

const { config } = require('./environment');

config.domain = void 0;
config.ip = void 0;

config.workspace.projects.forEach(p => {
  p.port = `2${p.port}`;
})


console.log('static config')

module.exports = exports = { config };



