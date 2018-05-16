const { getEnvironmentName, LOCAL_ENVIRONMENT_NAME, gethost } = require('tnp-helpers')

const routes = [
  {
    url: '/components',
    project: 'ss-common-ui',
    localEnvPort: 4201
  },
  {
    url: '/api',
    project: 'ss-common-logic',
    localEnvPort: 4000
  },
  {
    url: '/mobile',
    project: 'ss-mobileapp',
    localEnvPort: 4202
  },
  {
    url: '/admin',
    project: 'ss-admin-webapp',
    localEnvPort: 4201
  },
  {
    url: '/',
    project: 'ss-webapp',
    localEnvPort: 4200
  }
]


const config = {

  productionBuild: false,
  aot: false,
  isBaseline: true,
  name: getEnvironmentName(__filename),
  pathes: {
    backup: {
      audio: path.join(__dirname, 'backup', 'multimedia', 'audio'),
      video: path.join(__dirname, 'backup', 'multimedia', 'video'),
      picture: path.join(__dirname, 'backup', 'multimedia', 'picture')
    }
  },
  db: {
    database: 'tmp/db.sqlite3',
    type: 'sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  },
  host: gethost(__filename, routes),
  routes

}

module.exports = exports = config;


