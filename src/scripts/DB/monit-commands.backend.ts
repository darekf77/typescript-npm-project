import * as  psList from 'ps-list';
import { TnpDB } from '../../tnp-db/wrapper-db';
import { CommandInstance } from '../../tnp-db/entites';
import { Models } from 'tnp-models';
import { Helpers } from '../../helpers';
import { Project } from '../../project';
import { JSON10 } from 'json10';

export class DBMonitCommands {

  constructor(private db: TnpDB) {

  }

  async start() {
    this.repeat();
  }

  counter = 0;
  private repeat(n = 0) {
    const cmds = this.db.getCommands();
    Helpers.clearConsole();
    Helpers.info(`COMMANDS ${++this.counter} :`)
    cmds.forEach(p => {
      Helpers.log(`\t${p.location}\t${p.command}\t${p.shortCommandForLastCommand}\n`);
    });

    setTimeout(() => {
      this.repeat(n + 1)
    }, 1000);
  }

}
