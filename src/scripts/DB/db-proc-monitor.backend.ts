import * as  psList from 'ps-list';
import { TnpDB } from '../../tnp-db/wrapper-db';
import { CommandInstance } from '../../tnp-db/entites';
import { Models } from 'tnp-models';
import { Helpers } from '../../helpers';
import { Project } from '../../project';

export class DBProcMonitor {

  constructor(private db: TnpDB) {

  }

  async start() {
    this.repeat();
  }

  private repeat(n = 0) {
    this.db.transaction.updateProcesses();
    const builds = this.db.getBuilds();
    Helpers.clearConsole();
    Helpers.log(`\n===== Check counter: ${n}, projects: ${Project.projects.length} === `)
    builds.forEach(b => {
      Helpers.log(`${b.pid}\t${b.location}\t${b.cmd}\t${b.buildOptions && b.buildOptions.watch}\n`);
    });
    // console.log('waiting')
    setTimeout(() => {
      this.repeat(n + 1);
    }, 1000)
  }

}
