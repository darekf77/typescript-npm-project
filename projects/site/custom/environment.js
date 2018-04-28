const { environmentName, LOCAL_ENVIRONMENT_NAME } = require('morphi')

const config = require('baseline/environment')

config.isBaseline = false;
config.name = environmentName(__filename, LOCAL_ENVIRONMENT_NAME)


config.routes = config.routes.map(route => {
    route.localEnvPort = route.localEnvPort + 1;
    return route;
})


module.exports = exports = config;
