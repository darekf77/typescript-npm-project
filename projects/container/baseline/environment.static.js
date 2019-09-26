const path = require('path')

const { config } = require('./environment');

config.domain = void 0;
config.ip = void 0;

config.workspace.projects.forEach(p => {
  p.port = `${p.port + 600}+`;
})


console.log('static config')

module.exports = exports = { config };



