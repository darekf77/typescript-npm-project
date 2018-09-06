const path = require('path')

const config = {

  pathes: {
    backup: {
      repositories: path.join(__dirname, 'backup', 'repositories'),
      builds: path.join(__dirname, 'backup', 'builds'),
      assets: path.join(__dirname, 'backup', 'multimedia'),
      audio: path.join(__dirname, 'backup', 'multimedia', 'audio'),
      video: path.join(__dirname, 'backup', 'multimedia', 'video'),
      picture: path.join(__dirname, 'backup', 'multimedia', 'picture')
    }
  },

  workspace: {
    workspace: {
      baseUrl: '/info',
      name: 'workspace',
      port: 6000
    },
    projects: [
      {
        baseUrl: '/components',
        name: 'ss-common-ui',
        port: 3202
      },
      {
        baseUrl: '/api',
        name: 'ss-common-logic',
        $db: {
          database: 'tmp/db.sqlite3',
          type: 'sqlite',
          synchronize: true,
          dropSchema: true,
          logging: false
        },
        port: 3000
      },
      {
        baseUrl: '/admin',
        name: 'ss-admin-webapp',
        port: 3201
      },
      {
        baseUrl: '/',
        name: 'ss-webapp',
        port: 3200
      }
    ]
  }

}

module.exports = exports = config;


