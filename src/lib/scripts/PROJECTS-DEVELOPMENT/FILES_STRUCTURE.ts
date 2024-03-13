//#region @backend
import { _, crossPlatformPath } from 'tnp-core/src';
import { fse } from 'tnp-core/src';
import { path } from 'tnp-core/src';
// import { notify } from 'node-notifier';
// import toast from 'powertoast';

import { Project } from '../../project/abstract/project/project';
import { Helpers } from 'tnp-helpers/src';
import { config, ConfigModels } from 'tnp-config/src';
import { MESSAGES } from '../../constants';

export async function $LINK_PROJECTS_AND_FILES(args: string, exit = true) {

  if (exit) {
    process.exit(0)
  }
}

async function askForWhenEmpty(): Promise<Project> {
  if (Helpers.exists(crossPlatformPath(path.join(crossPlatformPath(process.cwd()), config.file.package_json)))) {
    return;
  }
  let proj: Project;
  const yesNewProj = await Helpers.questionYesNo(`Do you wanna init project in this folder ?`);
  if (yesNewProj) {
    const responseProjectType = await Helpers.autocompleteAsk<ConfigModels.LibType>(`Choose type of project`, [
      { name: 'Container', value: 'container' },
      { name: 'Isomorphic Lib', value: 'isomorphic-lib' },
    ]);
    let smart = false;
    let monorepo = false;
    if (responseProjectType === 'container') {
      smart = await Helpers.consoleGui.question.yesNo('Do you wanna use smart container for organization project ?');
      monorepo = await Helpers.consoleGui.question.yesNo('Do you want your container to be monorepo ?');
      Helpers.writeFile([crossPlatformPath(process.cwd()), config.file.package_json], {
        name: crossPlatformPath(path.basename(crossPlatformPath(process.cwd()))),
        version: '0.0.0',
        tnp: {
          type: responseProjectType,
          monorepo,
          smart,
          version: config.defaultFrameworkVersion, // OK
        }
      });
    } else {
      Helpers.writeFile([crossPlatformPath(process.cwd()), config.file.package_json], {
        name: crossPlatformPath(path.basename(crossPlatformPath(process.cwd()))),
        version: '0.0.0',
        tnp: {
          type: responseProjectType,
          version: config.defaultFrameworkVersion, // OK
        }
      });
    }

    proj = Project.From(crossPlatformPath(process.cwd())) as Project;
    return proj;
  }
  return proj;
}

export async function $STRUCT(args: string, exit = true) {
  await askForWhenEmpty();
  let proj = (Project.Current as Project);
  proj = proj?.isSmartContainer ? proj : Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;

  if (proj) {
    await proj.filesStructure.struct(args);
  }

  if (exit) {
    process.exit(0)
  }
}

export async function STRUCTURE(args: string, exit = true) {
  await $STRUCT(args, exit);
}

export async function $INIT(args: string, exit = true) {
  await askForWhenEmpty();
  let proj = (Project.Current as Project);

  proj = proj?.isSmartContainer ? proj : Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj) {
    await proj.filesStructure.init(args);
  }
  if (exit) {
    process.exit(0)
  }
}
export async function INIT_ALL(args: string, exit = true) {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj) {
    if (!args) {
      args = '';
    }
    args += ` --recrusive`;
    await proj.filesStructure.init(args);
  }

  if (exit) {
    process.exit(0)
  }
}

// export async function INIT_ALL(args: string, exit = true) {

//   await (Project.Current as Project).filesStructure.init(args);
//   if ((Project.Current as Project).isWorkspace || (Project.Current as Project).isContainer) {
//     for (let index1 = 0; index1 < (Project.Current as Project).children.length; index1++) {
//       const child1 = (Project.Current as Project).children[index1];
//       await child1.filesStructure.init(args);
//       for (let index2 = 0; index2 < child1.children.length; index2++) {
//         const child2 = child1.children[index2];
//         await child2.filesStructure.init(args);
//       }
//     }
//   }

//   if (exit) {
//     process.exit(0)
//   }

// }

export async function CLEAN(args: string, exit = true) {
  const currentProj = (Project.Current as Project);

  const clear = async (proj: Project) => {
    if (proj.isContainer) {
      if (proj.isSmartContainer) {
        while (true) {
          try {
            proj.node_modules.remove();
            proj.smartNodeModules.remove();
            Helpers.remove(crossPlatformPath([proj.location, 'tmp-*']));
            proj.removeFolderByRelativePath(config.folder.dist);
            proj.removeFolderByRelativePath(config.folder.dist + '-app');
            proj.removeFolderByRelativePath(config.folder.tmpDistRelease);
            break;
          } catch (error) {
            // notify({
            //   title: '[User action required]',
            //   message: 'Please check your firedev build log...',
            // }).notify({
            //   title: '[User action required]',
            //   message: 'Please check your firedev build log...',
            // })
            Helpers.pressKeyAndContinue(MESSAGES.SHUT_DOWN_FOLDERS_AND_DEBUGGERS)
          }
        }

      }
      // await clear(proj);
      const children = proj.children.filter(c => (c.typeIs('isomorphic-lib') || c.isSmartContainer)
        && c.frameworkVersionAtLeast('v3') && c.npmPackages.useSmartInstall);
      for (let index = 0; index < children.length; index++) {
        const c = children[index];
        await clear(c);
      }
    } else if (proj.isStandaloneProject) {
      await proj.filesStructure.clearFromArgs(args);
      Helpers.remove(crossPlatformPath([proj.location, 'tmp-*']));
      Helpers.removeFileIfExists(crossPlatformPath([proj.location, 'src/app.hosts.ts']));
    }
  };

  await clear(currentProj);

  if (exit) {
    process.exit(0);
  }
}

export const CLEAR = async (args, exit = true) => {
  await CLEAN(args, exit);
  if (exit) {
    process.exit(0);
  }
}

export async function CLEAN_ALL(args: string, exit = true) {
  const proj = (Project.Current as Project);
  if (proj.isSmartContainerChild) {
    await proj.parent.filesStructure.clear({ recrusive: true })
  } else {
    await proj.filesStructure.clear({ recrusive: true })
  }
  if (exit) {
    process.exit(0);
  }
}

export const CLEAR_ALL = CLEAN_ALL;


export async function RESET(args: string, exit = true) {
  await (Project.Current as Project).filesStructure.resetFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}


export async function RESET_ALL(args: string, exit = true) {
  await (Project.Current as Project).filesStructure.reset({ recrusive: true })
  if (exit) {
    process.exit(0);
  }
}


function TEMPLATES_BUILDER() {
  (Project.Current as Project).filesTemplatesBuilder.rebuild();
  process.exit(0)
}


const $INIT_EVERYWHERE = (args) => {
  Project.projects.forEach(p => {
    p.run(`${config.frameworkName} init`).sync()
  })
}


// init().project();
// init().watch.project()
const CL = (args, exit) => CLEAN(args, exit);
const RST = (args, exit) => RESET(args, exit);
const RSTA = (args, exit) => RESET_ALL(args, exit);

export default {
  $INIT: Helpers.CLIWRAP($INIT, '$INIT'),
  $STRUCT: Helpers.CLIWRAP($STRUCT, '$STRUCT'),
  INIT_ALL: Helpers.CLIWRAP(INIT_ALL, 'INIT_ALL'),
  CLEAN: Helpers.CLIWRAP(CLEAN, 'CLEAN'),
  CLEAR: Helpers.CLIWRAP(CLEAR, 'CLEAR'),
  CL: Helpers.CLIWRAP(CL, 'CL'),
  CLEAN_ALL: Helpers.CLIWRAP(CLEAN_ALL, 'CLEAN_ALL'),
  CLEAR_ALL: Helpers.CLIWRAP(CLEAR_ALL, 'CLEAR_ALL'),
  RESET: Helpers.CLIWRAP(RESET, 'RESET'),
  RESET_ALL: Helpers.CLIWRAP(RESET_ALL, 'RESET_ALL'),
  RST: Helpers.CLIWRAP(RST, 'RST'),
  RSTA: Helpers.CLIWRAP(RSTA, 'RSTA'),
  TEMPLATES_BUILDER: Helpers.CLIWRAP(TEMPLATES_BUILDER, 'TEMPLATES_BUILDER'),
  $INIT_EVERYWHERE: Helpers.CLIWRAP($INIT_EVERYWHERE, '$INIT_EVERYWHERE'),
}
//#endregion
