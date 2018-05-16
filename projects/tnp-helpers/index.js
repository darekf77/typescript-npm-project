
const fs = require('fs');
const path = require('path');


exports.helloWorld = () => {
    console.log('This is amazing!')
    console.log(test.existsSync('asd'))
}

exports.getEnvironmentName = (filename) => {
    let name = path.basename(filename)
    name = name.replace(/\.js$/, '')
    name = name.replace('environment', '')
    name = name.replace(/\./g, '');
    return name === '' ? 'local' : name
}

exports.gethost = (packageName = '', routes = []) => {
    console.log('packageName', packageName)
    const c = routes.find(({ project }) => project === packageName);
    if (!c) {
        throw new Error(`Bad routing config for: ${packageName}`)
    }
    if (config.useRouter()) {
        if (c.url) {
            return url;
        }
    }
    return `http://localhost:${c.localEnvPort}`
}