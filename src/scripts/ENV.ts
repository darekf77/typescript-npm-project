//#region @backend
import { Project } from '../project';


import { Helpers } from "morphi";

function $CONFIGS() {
  console.log(Project.Current.env.configsFromJs.map(c => c.domain))
  process.exit(0)
}

function CHECK_ENV() {

  Helpers.checkEnvironment({
    npm: [
      { name: 'watch', version: '1.0.2' },
      { name: 'check-node-version' },
      { name: 'npm-run', version: '4.1.2' },
      { name: 'rimraf' },
      { name: 'mkdirp' },
      { name: 'renamer' },
      { name: 'nodemon' },
      { name: 'madge' },
      { name: 'http-server' },
      { name: 'increase-memory-limit' },
      { name: 'bower' },
      { name: 'fkill', installName: 'fkill-cli' },
      { name: 'mocha' },
      // { name: 'chai' },
      { name: 'ts-node' },
      { name: 'stmux' }
    ],
    programs: [
      //   {
      //     name: 'code',
      //     website: 'https://code.visualstudio.com/'
      //   }
    ]
  });
}

export default {
  $CONFIGS,
  CHECK_ENV,
  ENV_CHECK() {
    CHECK_ENV()
  }
}
//#endregion
