
const path = require('path');

const LOCAL_ENVIRONMENT_NAME = 'local';


function environmentName(filename, local_env_name) {
  let name = path.basename(filename)
  name = name.replace(/\.js$/, '')
  name = name.replace('environment', '')
  name = name.replace(/\./g, '');
  return name === '' ? local_env_name : name
}

const config = {

  productionBuild: false,
  aot: false,
  useRouter: () => config.name !== LOCAL_ENVIRONMENT_NAME,
  name: environmentName(__filename, LOCAL_ENVIRONMENT_NAME),
  db: {
    database: 'tmp/db.sqlite3',
    type: 'sqlite',
    synchronize: true,
    dropSchema: true,
    logging: true
  },
  host: (packageName) => {
    console.log('packageName', packageName)
    const c = config.routes.find(({ project }) => project === packageName);
    if (!c) {
      throw new Error(`Bad routing config for: ${packageName}`)
    }
    if (config.useRouter()) {
      if (c.url) {
        return url;
      }
    }
    return `http://localhost:${c.localEnvPort}`
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


