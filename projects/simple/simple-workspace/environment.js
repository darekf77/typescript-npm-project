
let { config } = require('tnp-bundle/environment-config')

console.log('hello change2')

config = {

  workspace: {
    workspace: {
      baseUrl: '/info',
      name: 'workspace',
      port: 5000
    },
    projects: [
      {
        baseUrl: '/api',
        name: 'simple-lib',
        port: 4000,
        $db: {
          name: 'default',
          database: 'tmp/db.sqlite3',
          type: 'sqlite',
          synchronize: true,
          dropSchema: true,
          logging: false
        }
      },
    ]
  }

}

module.exports = exports = { config };


