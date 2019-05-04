const path = require('path')
let { config } = require('tnp-bundle/environment-config')

config = {

  domain: 'francuzkidlamezczyzn.pl',

  pathes: {
    backup: {
      assets: path.join(__dirname, 'backup', 'multimedia'),
      audio: path.join(__dirname, 'backup', 'multimedia', 'audio'),
      video: path.join(__dirname, 'backup', 'multimedia', 'video'),
      picture: path.join(__dirname, 'backup', 'multimedia', 'picture')
    }
  },

  workspace: {
    workspace: {
      // baseUrl: '/info',
      name: 'workspace',
      port: 5555
    },
    projects: [
      {
        baseUrl: '/components',
        name: 'ss-common-ui',
        port: 6001
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
        port: 6002
      },
      // {
      //   baseUrl: '/admin',
      //   name: 'ss-admin-webapp',
      //   port: 6003
      // },
      // {
      //   baseUrl: '/',
      //   name: 'ss-webapp',
      //   port: 6004
      // }
    ]
  }

}

module.exports = exports = { config };


