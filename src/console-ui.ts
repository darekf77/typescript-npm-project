//#region @backend
import { Project } from './project/base-project';
import { prompt } from 'enquirer';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import { EnumValues } from 'enum-values'
import { buildLib, buildApp } from './scripts/BUILD';
import { CommandInstance } from './tnp-db/entites';
import {  killProcessByPort } from './process';
import { TnpDB } from './tnp-db/wrapper-db';
import * as fuzzy from 'fuzzy'
import * as inquirer from 'inquirer'
import * as inquirerAutocomplete from 'inquirer-autocomplete-prompt'
import { init } from './scripts/INIT';
import { clear } from './scripts/CLEAR';
inquirer.registerPrompt('autocomplete', inquirerAutocomplete)

class Choice {
  constructor(
    public name: string,
    // public key: string,
    public value: string
  ) {

  }

  // toLowerCase() {
  //   return this.value.toLowerCase()
  // }
}

const CHOICE = {
  LAST_USED_COMMAND: 'Last used command',
  BUILD_DIST_WATCH: 'build:dist:watch',
  BUILD_APP_WATCH: 'build:app:watch',
  INIT: 'init',
  BUILD_DIST: 'build:dist',
  BUILD_APP: 'build:app',
  START_SERVER: 'start',
  CLEAR: 'clear',
  CLEAR_RECUSIVE_WITH_NODE_MODUELS: 'clear:all --recrusive',
  KILL_ON_PORT: 'killonport',
  HELP: 'help',
}

export class ConsoleUi {

  private readonly lastCommandFileName = 'last-command.txt'
  constructor(public project: Project, private db: TnpDB) {

  }

  lastCmd: CommandInstance;
  get lastCommandAvailable(): Boolean {
    this.lastCmd = this.db.lastCommandFrom(this.project.location)
    // console.log('this.lastCmd',this.lastCmd)
    // this.db.commandsSet.
    return !!this.lastCmd;
  }



  async init(functions: Function[]) {

    // const choices = [
    //   { value: 'valuies', name: 'dupa' },
    //   { value: 'valuies2', name: 'dupa2' },
    //   { value: 'valuies3', name: 'dupa3' }
    // ]
    const choices = Object.keys(CHOICE)
      .map(key => {
        return { name: key, value: CHOICE[key] }
      })
      .filter(({ name, value }) => {
        if (!name) {
          return false;
        }
        if (!this.lastCommandAvailable) {
          if (value === CHOICE.LAST_USED_COMMAND) {
            return false
          }
        }
        return true;
      })
      .map((s) => {
        const { value, name } = s;
        if (value === CHOICE.LAST_USED_COMMAND) {
          s.name = `${s.name}: ${this.lastCmd.shortCommandForLastCommand}`
        }
        return new Choice(s.name, s.value as any);
      })




      // .concat(functions
      //   // .filter( f => !!f.name  )
      //   .map(f => {
      //     let name = f.name;
      //     if (name.startsWith('$')) {
      //       name = name.slice(1)
      //     }
      //     const value = f.name;
      //     return new Choice(name, value);
      //   })
      //   .filter(f => {

      //     let name = f.name;
      //     if (name.startsWith('$')) {
      //       name = name.slice(1)
      //     }

      //     return !!f.name && !CHOICE[f.name] && !CHOICE[name]
      //   })
      // )
      .filter(f => !!f)


    const source = function searchFood(answers, input) {
      input = input || '';
      return new Promise(function (resolve) {
        var fuzzyResult = fuzzy.filter(input, choices.map(f => f.name));
        resolve(
          fuzzyResult.map(function (el) {
            return { name: el.original, value: choices.find(c => c.name === el.original).value };
          })
        );
      });
    }


    let res: { command: string } = await inquirer.prompt({
      type: 'autocomplete',
      name: 'command',
      pageSize: 10,
      source,
      message: 'What you wanna do ? ',
      choices
    } as any) as any;

    // console.log('res', res)

    switch (res.command) {

      case CHOICE.INIT:
        this
        this.db.transaction.setCommand(`tnp ${res.command}`)
        await init('')
        process.exit(0)
        break;

      case CHOICE.BUILD_APP_WATCH:
        this.db.transaction.setCommand(`tnp ${res.command}`)
        await buildApp(false, true, 'dist', '')
        break;

      case CHOICE.BUILD_DIST_WATCH:
        this.db.transaction.setCommand(`tnp ${res.command}`)
        await buildLib(false, true, 'dist', '')
        break;

      case CHOICE.BUILD_APP:
        this.db.transaction.setCommand(`tnp ${res.command}`)
        await buildApp(false, false, 'dist', '')
        break;

      case CHOICE.BUILD_DIST:
        this.db.transaction.setCommand(`tnp ${res.command}`)
        await buildLib(false, false, 'dist', '')
        break;

      case CHOICE.LAST_USED_COMMAND:
        await this.db.runCommand(!!this.lastCmd ?
          this.lastCmd : new CommandInstance(undefined, this.project.location)
        );
        break;

      case CHOICE.CLEAR:
        await clear('')
        break;

      case CHOICE.CLEAR_RECUSIVE_WITH_NODE_MODUELS:
        await Project.Current.clear(true, true)
        break;

      case CHOICE.KILL_ON_PORT:
        let num: { port: number } = await prompt({
          type: 'numeral',
          name: 'port',
          message: 'Please port number'
        }) as any;
        killProcessByPort(num.port);
        process.exit(0)
        break;

      // default:
      //   const fn = functions.find(f => f.name === res.command);
      //   if (_.isFunction(fn)) {
      //     this.db.commands.setCommand(process.cwd(), `tnp ${paramsFrom(fn.name)}`)
      //     await runSyncOrAsync(fn)
      //   } else {
      //     throw `Command not implemented: ${res.command}`
      //   }

      //   break;
    }

  }

}
//#endregion
