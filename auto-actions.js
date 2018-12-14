const os = require('os')
const chalk = require('chalk').default;

const pathes = {
  "Dariuszs-MacBook-Pro-3.local": "/Users/darekf/projects/npm/",
  "dariuszs-mbp-3.gtk.gtech.com": "/Users/darekf/projects/npm/",
  // "dariuszs-mbp-2.gtk.gtech.com": "Dariuszs-MacBook-Pro-2.local",
  // "Dariuszs-MBP-2": "Dariuszs-MacBook-Pro-2.local",
  // "Dariuszs-MacBook-Pro-3.local": "Dariuszs-MacBook-Pro-2.local",
  // "dariuszs-mbp-3.gtk.gtech.com": "Dariuszs-MacBook-Pro-2.local",
  // "dariusz-ubuntu": "Dariuszs-MacBook-Pro-2.local",
}

const hostname = os.hostname()
// console.log('hostname',hostname)
const base = pathes[hostname]
if (!base) {
  console.error(chalk.red('Bad hostname in ') + chalk.bold(__filename))
  console.warn('Your hostname is: ', hostname)
  process.exit()
}
// console.log('base',base)
const autoreleases = require('./auto-releases')(base)
const builds = require('./auto-builds')(base)


module.exports = exports = {
  autoreleases,
  builds
}
