//#region @backend
import { _, crossPlatformPath } from 'tnp-core';
import { path } from 'tnp-core';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { BuildOptions } from 'tnp-db';

async function askForWhenEmpty(): Promise<Project> {
  if (Helpers.exists(crossPlatformPath(path.join(crossPlatformPath(process.cwd()), config.file.package_json)))) {
    return;
  }
  let proj: Project;
  const yesNewProj = await Helpers.questionYesNo(`Do you wanna init project in this folder ?`);
  if (yesNewProj) {
    const response = await Helpers.autocompleteAsk<ConfigModels.LibType>(`Choose type of project`, [
      { name: 'Container', value: 'container' },
      { name: 'Workspace', value: 'workspace' },
      { name: 'Isomorphic Lib', value: 'isomorphic-lib' },
      { name: 'Angular Lib', value: 'angular-lib' }
    ]);
    Helpers.writeFile([crossPlatformPath(process.cwd()), config.file.package_json], {
      name: crossPlatformPath(path.basename(crossPlatformPath(process.cwd()))),
      version: '0.0.0',
      tnp: {
        type: response,
        version: config.defaultFrameworkVersion,
      }
    });
    proj = Project.From(crossPlatformPath(process.cwd())) as Project;
    return proj;
  }
  return proj;
}


export async function $INIT(args: string, exit = true) {
  await askForWhenEmpty();
  let proj = (Project.Current as Project);

  proj = proj?.isSmartContainer ? proj : Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj) {
    await proj.filesStructure.init(BuildOptions.fromJson({
      outDir: 'dist'
    }));
    await proj.filesStructure.init(BuildOptions.fromJson({
      outDir: 'bundle'
    }));
  }
  if (exit) {
    process.exit(0)
  }
}

export async function INIT_ALL(args: string, exit = true) {
  const proj = Helpers.cliTool.resolveChildProject(args, Project.Current) as Project;
  if (proj) {
    await proj.filesStructure.init(BuildOptions.fromJson({
      recrusive: true
    }));
  }

  if (exit) {
    process.exit(0)
  }
}


export async function CLEAN(args: string, exit = true) {
  const currentProj = (Project.Current as Project);

  const clear = async (proj: Project) => {
    if (proj.isContainer) {
      if (proj.isSmartContainer) {
        proj.node_modules.remove();
        proj.smartNodeModules.remove();
        proj.removeFolderByRelativePath(config.folder.dist);
        proj.removeFolderByRelativePath(config.folder.bundle);
        proj.removeFolderByRelativePath(config.folder.dist + '-app');
        proj.removeFolderByRelativePath(config.folder.bundle + '-app');
        proj.removeFolderByRelativePath(config.folder.tmpBundleRelease);
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
  if (proj.isWorkspaceChildProject && proj.isSmartContainerChild) {
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
  if ((Project.Current as Project).isWorkspaceChildProject) {
    await (Project.Current as Project).parent.filesStructure.reset({ recrusive: true })
  } else {
    await (Project.Current as Project).filesStructure.reset({ recrusive: true })
  }
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

const CL = (args, exit) => CLEAN(args, exit);
const RST = (args, exit) => RESET(args, exit);
const RSTA = (args, exit) => RESET_ALL(args, exit);

export default {
  $INIT: Helpers.CLIWRAP($INIT, '$INIT'),
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
