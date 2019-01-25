import { Project } from '../project';
import * as _ from 'lodash';

export class CommandInstance {
  constructor(
    public command?: string,
    public location?: string
  ) {
    this.command = CommandInstance.fixedCommand(command)
  }

  public static fixedCommand(command: string) {
    // console.log(`command to fix: ${command}`)
    if (!command) {
      return command
    }
    const args = command.split(' ');
    const i = args.findIndex(arg => arg.endsWith(`/bin/tnp`))
    if (i === -1) {
      return command;
    }
    // console.log('founded index', i)
    let res = `tnp ${args.slice(i + 1, args.length).join(' ')}`
    // console.log('res', res)
    return res;
  }

  get shortCommandForLastCommand() {
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
        const c = new CommandInstance(command, location)
        return c;
      }
    }
  }

}
