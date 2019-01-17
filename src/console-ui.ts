//#region @backend
import { Project } from './project/base-project';
import { prompt } from 'enquirer';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import { EnumValues } from 'enum-values'
import { buildLib } from './scripts/BUILD';
import { CommandInstance } from './tnp-db/command-instance';
import { clearConsole } from './process';
import { TnpDB } from './tnp-db/wrapper-db';
import { runSyncOrAsync } from './helpers';
import * as fuzzy from 'fuzzy'
import * as inquirer from 'inquirer'
import * as inquirerAutocomplete from 'inquirer-autocomplete-prompt'
inquirer.registerPrompt('autocomplete', inquirerAutocomplete)



enum CHOICE {
  LAST_USED_COMMAND = 'Last used command',
  BUILD_DIST_WATCH = 'build:dist:watch',
  BUILD_APP_WATCH = 'build:app:watch',
  INIT = 'init',
  BUILD_DIST = 'build:dist',
  BUILD_APP = 'build:app',
  START_SERVER = 'start',
  CLEAR = 'clear',
  CLEAR_RECUSIVE_WITH_NODE_MODUELS = 'clear:all --recrusive',
  KILL_ON_PORT = 'killonport',
  HELP = 'help',
}

export class ConsoleUi {

  private readonly lastCommandFileName = 'last-command.txt'
  constructor(public project: Project, private db: TnpDB) {

  }

  lastCmd: CommandInstance;
  get lastCommandAvailable(): Boolean {
    this.lastCmd = this.db.commands.lastCommandFrom(this.project.location)
    // this.db.commandsSet.
    return !!this.lastCmd;
  }



  async init(functions: Function[]) {
    // clearConsole()

    const choisesSet = {};

    const choices = EnumValues
      .getNamesAndValues(CHOICE)
      .filter(({ name, value }) => {
        if (!this.lastCommandAvailable) {
          if (value === CHOICE.LAST_USED_COMMAND) {
            return false
          }
        }
        return true;
      })
      .map(({ value, name }) => {
        choisesSet[value] = name;
        return name;
      })
      .concat(functions.map(f => {
        let name = f.name;
        if (name.startsWith('$')) {
          name = name.slice(1)
        }
        choisesSet[name] = f;
        return name
      }))
      .filter(f => !!f)


    const source = function searchFood(answers, input) {
      input = input || '';
      return new Promise(function (resolve) {
        var fuzzyResult = fuzzy.filter(input, choices);
        resolve(
          fuzzyResult.map(function (el) {
            return el.original;
          })
        );
      });
    }


    let res: { command: CHOICE } = await inquirer.prompt({
      type: 'autocomplete',
      name: 'command',
      pageSize: 10,
      source,
      message: 'What you wanna do ? ',
      choices
    } as any) as any;

    // let res: { command: CHOICE } = await prompt({
    //   type: 'autocomplete',
    //   name: 'command',
    //   limit: 10,
    //   message: 'What you wanna do',
    //   suggest(input, choices) {
    //     // return fuzzy.filter(input, choices.map(c => c.message));
    //     return choices.filter(choice => {
    //       let m = choice.message;
    //       return fuzzy.filter(input, [m]).length > 0
    //       // return choice.message.startsWith(input)
    //     });
    //   },
    //   choices: EnumValues
    //     .getNamesAndValues(CHOICE)
    //     .filter(({ name, value }) => {
    //       if (!this.lastCommandAvailable) {
    //         if (value === CHOICE.LAST_USED_COMMAND) {
    //           return false
    //         }
    //       }
    //       return true;
    //     })
    //     .concat(functions.map(f => {
    //       let name = f.name;
    //       if (name.startsWith('$')) {
    //         name = name.slice(1)
    //       }
    //       return { name, value: f.name } as any;
    //     }))
    // } as any) as any;

    if (res.command === CHOICE.BUILD_DIST_WATCH) {
      await buildLib(false, true, 'dist', '')
    }
    else if (res.command === CHOICE.BUILD_DIST) {
      await buildLib(false, false, 'dist', '')
    } else if (res.command === CHOICE.LAST_USED_COMMAND) {
      await this.db.commands.runCommand(this.lastCmd);
    } else {
      const fn = choisesSet[res.command];
      if (_.isFunction(fn)) {
        await runSyncOrAsync(fn)
      }
    }
  }

}
//#endregion
