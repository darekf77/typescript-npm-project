//#region @backend
import { _, crossPlatformPath, path } from 'tnp-core';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { ProjectFactory } from './project-factory.backend';
import { ConfigModels } from 'tnp-config';
import { Project } from '../../project';
import { config } from 'tnp-config';
import { MagicRenamer } from 'magic-renamer';

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

export async function $UPDATE(args: string) {
  const cwd = crossPlatformPath(process.cwd());

  const proj = Project.From(cwd);

  if (proj.isContainer) {

    const linkedProjects = Helpers.foldersFrom(cwd)
      .map(f => path.basename(f))
      .filter(f => !f.startsWith('.'))
      .filter(f => Helpers.checkIfNameAllowedForFiredevProj(f))
      .filter(f => !!Project.From([cwd, f]))
      ;

    if (Helpers.exists([cwd, config.file.package_json__tnp_json5]) && Helpers.exists([cwd, config.file.package_json__tnp_json])) {
      Helpers.remove([cwd, config.file.package_json__tnp_json]);
    }

    if (Helpers.exists([cwd, config.file.package_json__tnp_json5])) {
      Helpers.remove([cwd, config.file.package_json__tnp_json]);
    }

    const orgPj = Helpers.readJson([cwd, config.file.package_json]) as Models.npm.IPackageJSON;

    const endAction = () => {
      const gitIgnore = `

    ${linkedProjects.map(l => `/${l}`).join('\n')}

      `;
      Helpers.writeFile([cwd, config.file._gitignore], gitIgnore);



      if (!Helpers.git.isGitRoot(cwd)) {
        Helpers.run('git init', { cwd }).sync()
      }

      Helpers.run(`${config.frameworkName} init`, { cwd }).sync();
    }

    if (orgPj?.tnp) {
      if (await Helpers.questionYesNo(`

    Deteced project:
${linkedProjects.map(l => `- ${l}`).join('\n')}


Would you like to update current project configuration?`)) {
        const pf = {
          name: path.basename(cwd),
          version: orgPj.version,
          [config.frameworkNames.tnp]: orgPj.tnp,
        };
        const tnp = (pf[config.frameworkNames.tnp] as Models.npm.TnpData);
        tnp.type = 'container';
        tnp.version = config.defaultFrameworkVersion;
        tnp.linkedProjects = linkedProjects;
        Helpers.writeFile([cwd, config.file.package_json], pf);
        Helpers.remove([cwd, config.file.package_json__tnp_json]);
        Helpers.remove([cwd, config.file.package_json__tnp_json5]);
        endAction();
      }
    } else {
      const pf = {
        name: path.basename(cwd),
        version: "0.0.0",
        [config.frameworkNames.tnp]: {
          version: config.defaultFrameworkVersion,
          type: 'container',
          linkedProjects,
        } as Models.npm.TnpData,
      };
      Helpers.writeFile([cwd, config.file.package_json], pf);
      endAction();
    }

    Helpers.info('Done');
  }

  process.exit(0)
}


async function $COPY_AND_RENAME(args: string) {
  // console.log(`>> ${args} <<`)
  const cwd = process.cwd();
  // @LAST CWD from arg is not working src\lib\helpers-cli-tool.backend.ts
  const ins = MagicRenamer.Instance(cwd);
  await ins.start(args, true);
  process.exit(0);
}

async function $GENERATE(args: string) {
  const argsv = args.split(' ');
  let [absPath, moduleName, entityName] = argsv;
  if (!Helpers.exists(absPath)) {
    Helpers.mkdirp(absPath);
  }
  const absFilePath = crossPlatformPath(absPath);
  if (!Helpers.isFolder(absPath)) {
    absPath = crossPlatformPath(path.dirname(absPath));
  }
  entityName = decodeURIComponent(entityName);
  const nearestProj = Project.nearestTo(process.cwd()) as Project;
  const container = Project.by('container', nearestProj._frameworkVersion) as Project;
  const myEntity = 'my-entity';

  const flags = {
    flat: '_flat',
    custom: '_custom',
  }

  const isFlat = moduleName.includes(flags.flat);
  moduleName = moduleName.replace(flags.flat, '');

  const isCustom = moduleName.includes(flags.custom);
  moduleName = moduleName.replace(flags.custom, '');

  const exampleLocation = crossPlatformPath([container.location, 'gen-examples', moduleName, myEntity]);


  const newEntityName = _.kebabCase(entityName);
  const generatedCodeAbsLoc = crossPlatformPath([container.location, 'gen-examples', moduleName, newEntityName]);
  Helpers.removeFolderIfExists(generatedCodeAbsLoc);
  let destination = crossPlatformPath([absPath, newEntityName]);
  if (isFlat) {
    destination = crossPlatformPath(path.dirname(destination));
  }

  if (isCustom) {
    if (moduleName === 'generated-index-exports') {
      const allowedFilesExt = ['.ts', '.tsx'];
      const frontendFiles = [
        '.component.ts',
        '.container.ts',
        '.directive.ts',
        '.pipe.ts',
        '.module.ts',
        '.service.ts',
        '.actions.ts',
        '.effects.ts',
        '.reducers.ts',
        '.selectors.ts',
      ]
      const backendFiles = ['.backend.ts']
      const folders = [
        ...Helpers.foldersFrom(absPath).map(f => path.basename(f)),
        ...Helpers.filesFrom(absPath, false).map(f => path.basename(f)),
      ]
        .filter(f => !['index.ts'].includes(f))
        .filter(f => !f.startsWith('.'))
        .filter(f => !f.startsWith('_'))
        .filter(f => !f.endsWith('.routes.ts'))
        .filter(f => (path.extname(f) === '') || !_.isUndefined(allowedFilesExt.find(a => f.endsWith(a))))
        ;
      Helpers.writeFile(
        crossPlatformPath([absPath, config.file.index_ts]),
        folders.map(f => {
          if (!_.isUndefined(frontendFiles.find(bigExt => f.endsWith(bigExt)))) {
            return `//#region @${'brow' + 'ser'}\n`
              + `export * from './${f.replace(path.extname(f), '')}';`
              + `\n//${'#end' + 'region'}`
          }
          if (!_.isUndefined(backendFiles.find(bigExt => f.endsWith(bigExt)))) {
            return `//#region @${'back' + 'end'}\n`
              + `export * from './${f.replace(path.extname(f), '')}';`
              + `\n//${'#end' + 'region'}`
          }
          return `export * from './${f.replace(path.extname(f), '')}';`
        }).join('\n') + '\n'
      );
    }
    if (moduleName === 'wrap-with-browser-regions') {
      if (!Helpers.isFolder(absFilePath)) {
        const content = Helpers.readFile(absFilePath);
        Helpers.writeFile(absFilePath,
          `//#region @${'brow' + 'ser'}\n`
          + content
          + `\n//${'#end' + 'region'}\n`
        );
      }
    }
  } else {
    const ins = MagicRenamer.Instance(exampleLocation);
    ins.start(`${myEntity} -> ${newEntityName}`, true);
    if (isFlat) {
      const files = Helpers.filesFrom(generatedCodeAbsLoc, true);
      for (let index = 0; index < files.length; index++) {
        const fileAbsPath = crossPlatformPath(files[index]);
        const relative = fileAbsPath.replace(generatedCodeAbsLoc + '/', '');
        const destFileAbsPath = crossPlatformPath([destination, relative]);
        Helpers.copyFile(fileAbsPath, destFileAbsPath);
      }
      Helpers.remove(generatedCodeAbsLoc, true)
    } else {
      Helpers.move(generatedCodeAbsLoc, destination);
    }
  }
  process.exit(0)
}



export default {
  $COPY_AND_RENAME: Helpers.CLIWRAP($COPY_AND_RENAME, '$COPY_AND_RENAME'),
  $UPDATE: Helpers.CLIWRAP($UPDATE, '$UPDATE'),
  $GENERATE: Helpers.CLIWRAP($GENERATE, '$GENERATE'),
  REMOVE: Helpers.CLIWRAP(REMOVE, 'REMOVE'),
  RM: Helpers.CLIWRAP(RM, 'RM'),
  NEW: Helpers.CLIWRAP(NEW, 'NEW'),
  NEW_SITE: Helpers.CLIWRAP(NEW_SITE, 'NEW_SITE'),
  $NEW_STRICT_SITE: Helpers.CLIWRAP($NEW_STRICT_SITE, '$NEW_STRICT_SITE'),
  $NEW_DEPENDENCY_SITE: Helpers.CLIWRAP($NEW_DEPENDENCY_SITE, '$NEW_DEPENDENCY_SITE'),
};

//#endregion
