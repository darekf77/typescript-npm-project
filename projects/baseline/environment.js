const path = require('path')

const config = {

  pathes: {
    backup: {
      audio: path.join(__dirname, 'backup', 'multimedia', 'audio'),
      video: path.join(__dirname, 'backup', 'multimedia', 'video'),
      picture: path.join(__dirname, 'backup', 'multimedia', 'picture')
    }
  },

  workspace: {
    projects: [
      {
        baseUrl: '/components',
        name: 'ss-common-ui',
        port: 4201
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
        port: 4000
      },
      {
        baseUrl: '/mobile',
        name: 'ss-mobileapp',
        port: 4202
      },
      {
        baseUrl: '/admin',
        name: 'ss-admin-webapp',
        port: 4201
      },
      {
        baseUrl: '/',
        name: 'ss-webapp',
        port: 4200
      }
    ]
  }

}

module.exports = exports = config;


