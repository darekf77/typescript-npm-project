//#region @backend
import { _, crossPlatformPath } from 'tnp-core';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { ProjectFactory } from './project-factory.backend';
import { ConfigModels } from 'tnp-config';
import { Project } from '../../project';
import { config } from 'tnp-config';

export async function RM(args: string, exit = true) {
  const proj = (Project.Current as Project);
  if (proj.isContainer) {
    const levels = args.replace(/\\/g, '/').replace(/\/$/, '').split('/');
    const appNameToRemove = levels.pop();
    const rootProj = Project.From([process.cwd(), levels.join('/')]) as Project;
    const child = rootProj.children.find(c => c.name === (args || '').trim().replace('/', ''))
    if (child) {
      child.removeItself();
      Helpers.info('Child removed');
      if (rootProj && rootProj.isContainer) {
        if (rootProj.isSmartContainer && !rootProj.smartContainerBuildTarget) {
          rootProj.removeFolderByRelativePath(config.folder.dist);
          rootProj.removeFolderByRelativePath(config.folder.bundle);
        }
        rootProj.removeFolderByRelativePath(config.folder.node_modules)
        if (rootProj.children.length === 0) {
          await rootProj.filesStructure.init('--skipSmartContainerDistBundleInit')
        } else {
          await rootProj.filesStructure.init('')
        }

      }
      Helpers.success('DONE');
      process.exit(0)
    }
    Helpers.warn('Child was not found', false);
    process.exit(0)
  }
  Helpers.error('This command is only for container.', false, true);
  process.exit(0)
}

export async function REMOVE(args: string, exit = true) {
  await RM(args, exit)
}

export async function NEW(args: string, exit = true) {
  const cwd = crossPlatformPath(process.cwd());
  const argv = args.split(' ');
  const type = 'isomorphic-lib';  // argv[0] as ConfigModels.NewFactoryType;
  // if (type === 'model') {
  //   await ProjectFactory.Instance.createModelFromArgs(args, exit, cwd);
  // } else {
  await ProjectFactory.Instance.containerStandaloneFromArgs(args, exit, cwd)
  // }
}
export function NEW_SITE(args: string, exit = true) {
  const cwd = crossPlatformPath(process.cwd());
  ProjectFactory.Instance.workspaceSiteFromArgs(args, exit, cwd, true);
}

export function $NEW_STRICT_SITE(args: string, exit = true) {
  const cwd = crossPlatformPath(process.cwd());
  ProjectFactory.Instance.workspaceSiteFromArgs(args, exit, cwd, true);
}

export function $NEW_DEPENDENCY_SITE(args: string, exit = true) {
  const cwd = crossPlatformPath(process.cwd());
  ProjectFactory.Instance.workspaceSiteFromArgs(args, exit, cwd, false);
}



export default {
  REMOVE: Helpers.CLIWRAP(REMOVE, 'REMOVE'),
  RM: Helpers.CLIWRAP(RM, 'RM'),
  NEW: Helpers.CLIWRAP(NEW, 'NEW'),
  NEW_SITE: Helpers.CLIWRAP(NEW_SITE, 'NEW_SITE'),
  $NEW_STRICT_SITE: Helpers.CLIWRAP($NEW_STRICT_SITE, '$NEW_STRICT_SITE'),
  $NEW_DEPENDENCY_SITE: Helpers.CLIWRAP($NEW_DEPENDENCY_SITE, '$NEW_DEPENDENCY_SITE'),
};

//#endregion
