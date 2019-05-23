const path = require('path')

const { config } = require('baseline/environment');

config.domain = 'ss-cloud.com'

config.workspace.workspace.port = `1${config.workspace.workspace.port}`;
config.workspace.projects.forEach(p => {
  p.port = `${Number(p.port) + 500}`;
})

config.pathes.backup.repositories = path.join(__dirname, 'backup', 'repositories');
config.pathes.backup.builds = path.join(__dirname, 'backup', 'builds');

config.cloud = {
  ports: {
    update: 9999
  }
}

module.exports = exports = { config };


