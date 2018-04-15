const { environmentName, LOCAL_ENVIRONMENT_NAME } = require('tnp')

const config = require('baseline/environment')

config.name = environmentName(__filename, LOCAL_ENVIRONMENT_NAME)


config.routes = config.routes.map(route => {
    route.localEnvPort = route.localEnvPort + 1;
    return route;
})


module.exports = exports = config;