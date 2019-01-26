import * as _ from 'lodash';
import { start } from '../../start';
import { error, warn } from '../../messages';

import { BaseController } from './base-controlller';
import { CommandInstance } from '../entites/command-instance';
import { BuildOptions } from '../../models/build-options';
import { Project } from '../../project';

export class CommandsController extends BaseController {
  async addExisted() {

  }

  lastCommandFrom(location: string): CommandInstance {
    const commands = this.crud.getALL<CommandInstance>(CommandInstance) as CommandInstance[];
    const cmd = commands.find(c => c.location === location)
    return cmd;
  }

  async runCommand(cmd: CommandInstance) {

    if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
      await start(cmd.command.split(' '));
    } else {
      error(`Last command for location: ${cmd.location} doen't exists`, false, true);
    }

  }
  async runLastCommandIn(location: string) {
    const commands = this.crud.getALL<CommandInstance>(CommandInstance) as CommandInstance[];
    const cmd = commands.find(c => c.location === location)
    if (cmd) {
      await start(cmd.command.split(' '));
    } else {
      error(`Last command for location: ${cmd.location} doen't exists`, false, true);
    }
  }

  updateCommandBuildOptions(location: string, buildOptions: BuildOptions) {
    const cmd = this.lastCommandFrom(location);
    if (cmd) {
      const clients = (buildOptions.forClient as Project[]).map(c => {
        return `--forClient ${c.name}`
      }).join(' ');
      cmd.command = cmd.command + ' ' + clients;
      this.crud.update(cmd)
    } else {
      warn(`Cannot update unexisted last commadn in location: ${location}`)
    }
  }


}
