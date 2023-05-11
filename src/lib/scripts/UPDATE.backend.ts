import { path } from 'tnp-core'
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';

import { Project } from '../project/abstract/project';
import { PackagesRecognition } from '../project/features/package-recognition/packages-recognition';

function $UPDATE_ISOMORPHIC() {
  PackagesRecognition.fromProject((Project.Current as Project)).start(true, '[update process]');
  process.exit(0)
}

async function $INIT_CORE() {
  Helpers.taskStarted(`${config.frameworkName} initing core projects`);
  let allCoreProject: (Project & {
    projectLinkedFiles: any; // TODO QUICKFIX,
    filesStructure: any;
  })[] = [];

  (config.coreProjectVersions as ConfigModels.FrameworkVersion[]).forEach(v => {
    let corePorjectsTypes: ConfigModels.LibType[] = ['isomorphic-lib'];
    if ((['v3', 'v1'] as ConfigModels.FrameworkVersion[]).includes(v)) {
      corePorjectsTypes = ['isomorphic-lib'];
    }
    const projects = corePorjectsTypes.map(t => Project.by(t, v));
    allCoreProject = [
      ...projects,
      ...allCoreProject,
    ] as any;
  });

  for (let index = 0; index < allCoreProject.length; index++) {
    const projectToInit = allCoreProject[index] as Project;
    Helpers.log(`${projectToInit.genericName} ${projectToInit.location}`);
    const linkedFiles = projectToInit.projectLinkedFiles();
    for (let index2 = 0; index2 < linkedFiles.length; index2++) {
      const l = linkedFiles[index2];
      const source = path.join(l.sourceProject.location, l.relativePath);
      const dest = path.join(projectToInit.location, l.relativePath);
      if (!Helpers.exists(source)) {
        Helpers.error(`[${config.frameworkName}] Core source do not exists: ${source}`, false, true);
      }
      Helpers.log(`${config.frameworkName} link from: ${source} to ${dest}`);
      // Helpers.remove(dest)
      Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
    }
    await projectToInit.filesStructure.struct();
  }
  Helpers.taskDone('DONE');
  process.exit(0)
}

async function MORPHISYNC(args, noExit = false) {
  const cwd = config.morphiPathUserInUserDir;
  Helpers.info(`Fetching git data...`);
  try {
    Helpers.run(`git reset --hard && git fetch`, { cwd, output: false }).sync();
  } catch (error) {
    Helpers.error(`[${config.frameworkName} Not ablt to pull origin of morphi: ${config.urlMorphi} in: ${cwd}`, false, true);
  }
  const tagToCheckout = Project.morphiTagToCheckoutForCurrentCliVersion(cwd);
  const currentBranch = Helpers.git.currentBranchName(cwd);
  Helpers.taskStarted(`Checking out lastest tag ${tagToCheckout} for firedev framework...`);
  if (currentBranch !== tagToCheckout) {
    try {
      Helpers.run(`git checkout ${tagToCheckout}`, { cwd }).sync()
    } catch (error) {
      console.log(error)
      Helpers.warn(`[${config.frameworkName} Not ablt to checkout latest tag of firedev framework (moprhi project) : ${config.urlMorphi} in: ${cwd}`, false);
    }
  }
  try {
    Helpers.run(`git pull origin ${tagToCheckout}`, { cwd }).sync()
  } catch (error) {
    console.log(error)
    Helpers.warn(`[${config.frameworkName} Not ablt to pull latest tag of firedev framework (moprhi project) : ${config.urlMorphi} in: ${cwd}`, false);
  }

  try {
    Helpers.run('rimraf .vscode', { cwd }).sync();
  } catch (error) { }
  Helpers.success('firedev-framework synced ok')
  if (!noExit) {
    process.exit(0);
  }
}


async function $AUTOUPDATE(args: string) {
  if (await Helpers.questionYesNo(`Proceed with ${config.frameworkName} auto-update ?`)) {
    if (config.frameworkName === 'firedev') {
      Helpers.run('npm i -g firedev --force').sync();
      await MORPHISYNC(args, true)
      const container = Project.by('container', config.defaultFrameworkVersion);
      container.run('firedev reinstall').sync();
      Helpers.success(`${config.frameworkName.toUpperCase()} AUTOUPDATE DONE`);
    }
    if (config.frameworkName === 'tnp') {
      Helpers.taskStarted('Removing old node_modules..');
      const nm = (Project.Tnp as Project).node_modules.path;
      const nm2 = (Project.Tnp as Project).pathFor(`tmp-${config.folder.node_modules}2`)
      const nm1 = (Project.Tnp as Project).pathFor(`tmp-${config.folder.node_modules}1`)

      Helpers.removeIfExists(nm2);
      if (Helpers.exists(nm1)) {
        Helpers.move(nm1, nm2);
      }
      Helpers.removeIfExists(nm1);
      if (Helpers.exists(nm)) {
        Helpers.move(nm, nm1);
      }
      Helpers.taskDone();

      Helpers.taskStarted(`Installing new version of ${config.frameworkName} pacakges`)
      Project.Tnp.run(`npm i --force && npm-run tsc && ${config.frameworkName} dedupe`).sync();
      Helpers.taskDone();
      Helpers.taskStarted('Installing new versions smart container pacakges')
      Project.by('container', (Project.Tnp as Project)._frameworkVersion).run(`${config.frameworkName} reinstall`).sync();
      Helpers.taskDone();

      Helpers.taskDone('AUTOUPDATE DONE');
    }
    process.exit(0);
  }


  // const file = path.basename(args.trim());
  // function processing() {
  //   Helpers.info(`processing file...`);
  // }
  // switch (file) {
  //   case config.file.tmpIsomorphicPackagesJson:
  //     processing();
  //     PackagesRecognition.fromProject((Project.Current as Project)).start(true, '[update process]');
  //     break;
  //   default:
  //     Helpers.error(`Not recognized file for update`, false, true);
  //     break;
  // }
  Helpers.info(`Update of ${config.frameworkName} name done.`);
  process.exit(0);
}

export async function SYNC(args) {
  await MORPHISYNC(args);
}

export async function BRANCH_NAME(args) {
  console.log(`current branch name: "${Helpers.git.currentBranchName(process.cwd())}"`);
  process.exit(0)
}

export default {
  $UPDATE_ISOMORPHIC: Helpers.CLIWRAP($UPDATE_ISOMORPHIC, '$UPDATE_ISOMORPHIC'),
  $AUTOUPDATE: Helpers.CLIWRAP($AUTOUPDATE, '$AUTOUPDATE'),
  $INIT_CORE: Helpers.CLIWRAP($INIT_CORE, '$INIT_CORE'),
  MORPHISYNC: Helpers.CLIWRAP(MORPHISYNC, 'MORPHISYNC'),
  SYNC: Helpers.CLIWRAP(SYNC, 'SYNC'),
  BRANCH_NAME: Helpers.CLIWRAP(BRANCH_NAME, 'BRANCH_NAME'),
};

