//#region @backend
import { info, error } from "../helpers";
import { run, killProcessByPort } from '../helpers';
import * as os from 'os';
import { TnpDB } from '../tnp-db';
import { Project } from '../project';

function killallnode() {
  run(`fkill -f node`).sync()
  // if (process.platform === 'win32') {
  //   run(`taskkill /F /im node.exe`).sync();
  // } else {
  //   run(`killall -9 node`).sync();
  // }
}

export async function killAll() {
  const db = await TnpDB.Instance;
  let projectsToKill = [];
  let p = Project.Current;
  projectsToKill.push(p)
  let workspace = p.isWorkspaceChildProject ? p.parent : void 0;
  if (!!workspace) {
    projectsToKill = projectsToKill.concat(workspace.children)
  }
  await db.transaction.killInstancesFrom(projectsToKill)
  process.exit(0)
}

export async function killonport(args, noExit = false) {
  const port = parseInt(args.trim())
  await killProcessByPort(port);
  if (!noExit) {
    process.exit(0)
  }
}


export default {
  $KILL_ON_PORT: async (args: string) => {
    await killonport(args);
  },
  $KILLONPORT: async (args: string) => {
    await killonport(args);
  },
  $KILLALL: () => {
    killAll()
  },
  $KILLALLNODE: () => {
    killallnode()
  }

}
//#endregion
