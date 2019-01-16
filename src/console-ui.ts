//#region @backend
import { Project } from './project/base-project';
import * as inquirer from 'inquirer';
import { prompt } from 'enquirer';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import { EnumValues } from 'enum-values'
import { buildLib } from './scripts/BUILD';
import { TnpDBModel } from './tnp-db';
import { CommandInstance } from './tnp-db/command-instance';

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
  constructor(public project: Project, private db: TnpDBModel) {

  }

  lastCmd: CommandInstance;
  get lastCommandAvailable(): Boolean {
    this.lastCmd = this.db.get.lastCommandFrom(this.project.location)
    return !!this.lastCmd;
  }



  async init() {

    let res: { command: CHOICE } = await prompt({
      type: 'autocomplete',
      name: 'command',
      message: 'What you wanna do',
      choices: EnumValues
        .getNamesAndValues(CHOICE)
        .filter(({ name, value }) => {
          if (!this.lastCommandAvailable) {
            if (value === CHOICE.LAST_USED_COMMAND) {
              return false
            }
          }
          return true;
        })
    }) as any;



    if (res.command === CHOICE.BUILD_DIST_WATCH) {

      await buildLib(false, true, 'dist', '')
    }
    else if (res.command === CHOICE.BUILD_DIST) {
      await buildLib(false, false, 'dist', '')
    } else if (res.command === CHOICE.LAST_USED_COMMAND) {
      await this.db.start.lastCommand(this.lastCmd);
    }
  }

}
//#endregion
