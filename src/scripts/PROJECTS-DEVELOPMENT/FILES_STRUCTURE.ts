//#region @backend
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';

export async function $LINK_PROJECTS_AND_FILES(args: string, exit = true) {

  if (exit) {
    process.exit(0)
  }
}

export async function $STRUCT(args: string, exit = true) {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;

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
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
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

export async function STATIC_INIT(args: string, exit = true) {
  // process.exit(0)
  const staticVersion = await (Project.Current as Project).StaticVersion();
  if (staticVersion) {
    await staticVersion.filesStructure.init(args);
  }

  if (exit) {
    process.exit(0)
  }
}

export async function STATIC_INIT_ALL(args: string, exit = true) {
  if (!args) {
    args = ''
  }
  args += ` --recrusive`;
  // process.exit(0)
  await (await (Project.Current as Project).StaticVersion()).filesStructure.init(args);
  if (exit) {
    process.exit(0)
  }
}

export async function CLEAN(args: string, exit = true) {
  await (Project.Current as Project).filesStructure.clearFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}

export const CLEAR = CLEAN;

export async function STATIC_CLEAN(args: string, exit = true) {
  await (await (Project.Current as Project).StaticVersion(false)).filesStructure.clearFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}

export const STATIC_CLEAR = STATIC_CLEAN;

export async function CLEAN_ALL(args: string, exit = true) {
  if ((Project.Current as Project).isWorkspaceChildProject) {
    await (Project.Current as Project).parent.filesStructure.clear({ recrusive: true })
  } else {
    await (Project.Current as Project).filesStructure.clear({ recrusive: true })
  }
  if (exit) {
    process.exit(0);
  }
}

export const CLEAR_ALL = CLEAN_ALL;

export async function STATIC_CLEAN_ALL(args: string, exit = true) {
  await (await (Project.Current as Project).StaticVersion(false)).filesStructure.clear({ recrusive: true })
  if (exit) {
    process.exit(0);
  }
}

export const STATIC_CLEAR_ALL = STATIC_CLEAN_ALL;

export async function RESET(args: string, exit = true) {
  await (Project.Current as Project).filesStructure.resetFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}


export async function RESET_ALL(args: string, exit = true) {
  if ((Project.Current as Project).isWorkspaceChildProject) {
    await (Project.Current as Project).parent.filesStructure.reset({ recrusive: true })
  } else {
    await (Project.Current as Project).filesStructure.reset({ recrusive: true })
  }
  if (exit) {
    process.exit(0);
  }
}

export async function STATIC_RESET(args: string, exit = true) {
  await (await (Project.Current as Project).StaticVersion(false)).filesStructure.resetFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}

export async function STATIC_RESET_ALL(args: string, exit = true) {
  let staticProj = await (Project.Current as Project).StaticVersion(false);
  if (staticProj.isWorkspaceChildProject) {
    staticProj = staticProj.parent;
  }
  await (await (Project.Current as Project).StaticVersion(false)).filesStructure.reset({ recrusive: true })
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
    p.run(`tnp init`).sync()
  })
}


// init().project();
// init().watch.project()
const S_INIT = (args, exit) => STATIC_INIT(args, exit);
const CL = (args, exit) => CLEAN(args, exit);
const SCL = (args, exit) => STATIC_CLEAN(args, exit);
const SCLA = (args, exit) => STATIC_CLEAN_ALL(args, exit);
const RST = (args, exit) => RESET(args, exit);
const RSTA = (args, exit) => RESET_ALL(args, exit);
const SRST = (args, exit) => STATIC_RESET(args, exit);
const SRSTA = (args, exit) => STATIC_RESET_ALL(args, exit);

export default {
  $INIT: Helpers.CLIWRAP($INIT, '$INIT'),
  $STRUCT: Helpers.CLIWRAP($STRUCT, '$STRUCT'),
  INIT_ALL: Helpers.CLIWRAP(INIT_ALL, 'INIT_ALL'),
  STATIC_INIT: Helpers.CLIWRAP(STATIC_INIT, 'STATIC_INIT'),
  STATIC_INIT_ALL: Helpers.CLIWRAP(STATIC_INIT_ALL, 'STATIC_INIT_ALL'),
  S_INIT: Helpers.CLIWRAP(S_INIT, 'S_INIT'),
  CLEAN: Helpers.CLIWRAP(CLEAN, 'CLEAN'),
  CLEAR: Helpers.CLIWRAP(CLEAR, 'CLEAR'),
  CL: Helpers.CLIWRAP(CL, 'CL'),
  STATIC_CLEAN: Helpers.CLIWRAP(STATIC_CLEAN, 'STATIC_CLEAN'),
  STATIC_CLEAR: Helpers.CLIWRAP(STATIC_CLEAR, 'STATIC_CLEAR'),
  SCL: Helpers.CLIWRAP(SCL, 'SCL'),
  CLEAN_ALL: Helpers.CLIWRAP(CLEAN_ALL, 'CLEAN_ALL'),
  CLEAR_ALL: Helpers.CLIWRAP(CLEAR_ALL, 'CLEAR_ALL'),
  STATIC_CLEAN_ALL: Helpers.CLIWRAP(STATIC_CLEAN_ALL, 'STATIC_CLEAN_ALL'),
  STATIC_CLEAR_ALL: Helpers.CLIWRAP(STATIC_CLEAR_ALL, 'STATIC_CLEAR_ALL,'),
  SCLA: Helpers.CLIWRAP(SCLA, 'SCLA'),
  RESET: Helpers.CLIWRAP(RESET, 'RESET'),
  RESET_ALL: Helpers.CLIWRAP(RESET_ALL, 'RESET_ALL'),
  RST: Helpers.CLIWRAP(RST, 'RST'),
  RSTA: Helpers.CLIWRAP(RSTA, 'RSTA'),
  STATIC_RESET: Helpers.CLIWRAP(STATIC_RESET, 'STATIC_RESET'),
  STATIC_RESET_ALL: Helpers.CLIWRAP(STATIC_RESET_ALL, 'STATIC_RESET_ALL'),
  SRST: Helpers.CLIWRAP(SRST, 'SRST'),
  SRSTA: Helpers.CLIWRAP(SRSTA, 'SRSTA'),
  TEMPLATES_BUILDER: Helpers.CLIWRAP(TEMPLATES_BUILDER, 'TEMPLATES_BUILDER'),
  $INIT_EVERYWHERE: Helpers.CLIWRAP($INIT_EVERYWHERE, '$INIT_EVERYWHERE'),
}
//#endregion
