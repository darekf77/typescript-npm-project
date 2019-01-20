import { Project } from '../project';
import * as _ from 'lodash';

export class CommandInstance {
  constructor(
  public command?: string,
  public location?: string
  ) {

  }

  get shortCMD() {
    if (!this.command) {
      return ''
    }
    const args = this.command.split(' ');
    if (_.first(args) === 'tnp') {
      return `tnp ${args[1]}`;
    }

    const tnpArg = args.find(arg => arg.endsWith(`/bin/tnp`))

    const i = args.indexOf(tnpArg);
    if (i < args.length - 1) {
      return `tnp ${args[i + 1]}`;
    }
    return ''
  }
  // project: Project;

  public static from(location: string) {
    return {
      command(command: string) {
        const c = new CommandInstance();
        c.location = location;
        c.command = command;
        return c;
      }
    }
  }

}
