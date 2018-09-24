const path = require('path')

const { config } = require('baseline/environment');


config.workspace.workspace.port = `1${config.workspace.workspace.port}`;
config.workspace.projects.forEach(p => {
  p.port = `1${p.port}`;
})

config.pathes.backup.repositories = path.join(__dirname, 'backup', 'repositories');
config.pathes.backup.builds = path.join(__dirname, 'backup', 'builds');


module.exports = exports = { config };


