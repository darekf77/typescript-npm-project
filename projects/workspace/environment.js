
const path = require('path');

const config = {

  productionBuild: false,
  aot: false,
  db: {
    database: 'tmp/db.sqlite3',
    type: 'sqlite',
    synchronize: true,
    dropSchema: true,
    logging: true
  },
  routes: [
    {
      url: '/components',
      project: 'angular-lib',
      localEnvPort: 4201
    },
    {
      url: '/api',
      project: 'isomorphic-lib',
      localEnvPort: 4000
    },
    {
      url: '/',
      project: 'angular-client',
      localEnvPort: 4200
    }
  ]

}

module.exports = exports = config;


