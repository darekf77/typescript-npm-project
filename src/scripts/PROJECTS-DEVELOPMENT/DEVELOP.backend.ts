import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from '../../project';
import { Helpers } from '../../helpers';
import * as path from 'path';
import { config } from '../../config';
import { TnpDB } from '../../tnp-db';


function killallnode() {
  Helpers.run(`fkill -f node`).sync()
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
  await Helpers.killProcessByPort(port);
  if (!noExit) {
    process.exit(0)
  }
}



function killvscode(args: string, exit = true) {
  try {
    Helpers.run(`kill -9 $(pgrep Electron)`).sync();
    Helpers.info(`Killled`)
  } catch (error) {
    Helpers.warn(`kill not needed`)
  }
  if (exit) {
    process.exit(0)
  }
}

export async function $DEVELOP(args: string, exit = true) {
  // console.log('adasdas')
  const { kill = false } = require('minimist')(!args ? [] : args.split(' '));
  const db = await TnpDB.Instance;
  let projects = db.getProjects()
    .map(p => p.project)
    .filter(p => !p.isGenerated);

  const igt = path.join(Project.Tnp.location, '../..', 'igt');
  // console.log('igt', igt)
  const unknowNPm: Project[] = [];
  if (fse.existsSync(igt)) {
    projects = projects.concat(fse.readdirSync(igt)
      .map(f => {
        f = path.join(igt, f);
        const proj = Project.From(f)
        // console.log(`${f} proj name: ${proj && proj.name}`);
        if (proj) {
          unknowNPm.push(proj)
        }
        return proj;
      }));
  }

  unknowNPm.forEach(p => {
    const external = path.join(p.location, 'external');
    if (fse.existsSync(external)) {
      projects = projects.concat(fse.readdirSync(external)
        .map(f => {
          f = path.join(external, f);
          const proj = Project.From(f)
          // console.log(`external proj name: ${proj && proj.name}`);
          if (proj) {
            unknowNPm.push(proj)
          }
          return proj;
        }));
    }
  });

  const projectsToOpen = args.trim().split(' ');
  const projectForAction: Project[] = [];

  projectsToOpen.forEach(projectName => {
    try {
      var regex = new RegExp(projectName);
    } catch (err) {
      Helpers.error(`Invalid regular expresion: ${projectName}`, false, true)
    }

    // console.log(`source: "${regex.source}"`)
    const projs = projects.filter(p => {
      return p && (p.genericName === projectName || regex.test(p.name))
    });
    if (projs) {
      projs.forEach(c => projectForAction.push(c));
    } else {
      Helpers.error(`Cannot find project: "${projectName}"`, true, true)
    }

    // projects.forEach(p => {
    //   console.log(`Test: ${p && p.name} with ${regex.source} ${p && regex.test(p.name)}`)
    //   return p && regex.test(p.name);
    // });

  });

  killvscode('', false);
  for (let index = 0; index < projectForAction.length; index++) {
    const projectToOpen = projectForAction[index];
    projectToOpen.openInVscode();
  }
  process.exit(0)
}

export default {
  $DEVELOP,
  killvscode,
  vscodekill(args) {
    killvscode(args);
  },
  close(args) {
    killvscode(args);
  },
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
