
const fs = require('fs');
const path = require('path');


exports.helloWorld = () => {
    console.log('This is amazing!')
    console.log(test.existsSync('asd'))
}

exports.LOCAL_ENVIRONMENT_NAME = 'local';

exports.environmentName = (filename, local_env_name) => {
    let name = path.basename(filename)
    name = name.replace(/\.js$/, '')
    name = name.replace('environment', '')
    name = name.replace(/\./g, '');
    return name === '' ? local_env_name : name
}