import { Project } from '../project';


export class CommandInstance {
  command: string;
  location: string;
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
