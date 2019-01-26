//#region @backend
import * as _ from 'lodash';
import glob = require('glob')
import * as path from 'path';
import { run as runCommand } from "./process";
import { Helpers } from "morphi";
import { match } from './helpers';
import { isString } from 'util';
import chalk from 'chalk';
import { Project } from './project';

import config from './config';
import { ConsoleUi } from './console-ui';
import { $LAST } from './scripts/DB';
import { TnpDB } from './tnp-db/wrapper-db';

process.env[config.message.tnp_bundle_mode] = 'false'

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

const localLibs = [
  'eslint',
  'mkdirp',
  'gulp',
  'npm-run',
  'rimraf',
  'nodemon',
  'release-it',
  'tsc',
  'watch',
  'http-server',
  'ts-node',
  'sort-package-json',
  'concurrently',
  'sloc',
  'morphi'
]

const helpAlias = [
  '-h',
  '--help',
  '-help',
  'help'
]



export async function start(argsv: string[]) {

  const db = await TnpDB.Instance;
  // console.log(argsv)
  if (
    (argsv.length === 2 && argsv[1].endsWith('/bin/tnp')) ||
    (argsv.length === 3 && argsv[1].endsWith('/bin/tnp')
      && argsv[2] === _.kebabCase(_.lowerCase($LAST.name))
    )
  ) {
    // info(`DO NOTHIGN`);
  } else {
    db.transaction.setCommand(argsv.join(' '), process.cwd());
  }

  let recognized = false;
  if (Array.isArray(argsv) && argsv.length >= 3) {
    const localLib = argsv[2];
    if (localLib === "i") {
      argsv[2] = 'install'
    }
    if (!helpAlias.includes(localLib) && localLibs.includes(localLib)) {
      recognized = true;
      const localPath = path.join(__dirname, '..', 'node_modules/.bin', localLib)
      const commadnToRun = `${localPath} ${argsv.slice(3).join(' ')}`
      try {
        runCommand(commadnToRun).sync()
      } catch (error) {
        console.log(`Command ${localLib} ERROR...`);
      }
      process.exit(0)
    }
  }

  // await initWatcherDB();
  // process.stdin.resume();

  const helpFile = glob.sync(path.join(__dirname, '/scripts/HELP.js'))[0]
  const files = [helpFile]
    .concat(glob.sync(path.join(__dirname, '/scripts/**/*.js')).filter(f => f != helpFile))

  const functions: Function[] = []

  files.forEach(function (file) {
    let defaultObjectFunctionsOrHelpString = require(path.resolve(file)).default;
    if (_.isObject(defaultObjectFunctionsOrHelpString)) {
      _.forIn(defaultObjectFunctionsOrHelpString, (v: Function | [Function, string] | string, k) => {
        if (recognized) {
          return
        }
        if (!isString(v)) {
          const vFn: Function = (Array.isArray(v) && v.length >= 1 ? v[0] : v) as any;
          functions.push(vFn)
          if (_.isFunction(vFn)) {
            const check = match(k, argsv);
            if (check.isMatch) {
              recognized = true;
              vFn.apply(null, [check.restOfArgs.join(' ')]);
              return;
            }
          }
        }

      })
    }
  });
  if (recognized) {
    // console.log("RECOGNIZED !!")
    process.stdin.resume();
  } else {
    // console.log("NOT RECOGNIZED !!")
    if (Array.isArray(argsv) && argsv.length == 3) {
      console.log(`\n${chalk.red('Not recognized command')}: ${chalk.bold(argsv[2])}\n`)
      process.exit(0);
    } else if (Array.isArray(argsv) && argsv.length >= 3) {
      console.log(`\n${chalk.red('Not recognized arguments:')} ${chalk.bold(argsv.slice(2).join(' '))}\n`)
      process.exit(0);
    } else {
      const p = Project.Current;

      if (p) {

        const ui = new ConsoleUi(p, db);
        try {
          await ui.init(functions)
        } catch (e) {
          // console.log(e)
          process.exit(0)
        }
      } else {
        console.log(`\n${chalk.cyan('Please use help:')} ${chalk.bold('tnp run help')}\n`)
        process.exit(0);
      }
    }
  }


}






//#endregion
