const path = require('path')

const { config } = require('./environment');

config.domain = `stage.${config.domain}`

console.log('stage config')

module.exports = exports = { config };



