//#region imports
import { glob, _ } from 'tnp-core/src';
import * as express from 'express';
import { path } from 'tnp-core/src'
import { fse } from 'tnp-core/src'
import { config } from 'tnp-config/src';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers/src';
import chalk from 'chalk';
//#endregion

//#region open

//#region open / open

async function $OPEN(args: string) {
  Helpers.openFolderInFileExploer(process.cwd());
  process.exit(0);

}
//#endregion

//#region open / core container
function $OPEN_CORE_CONTAINER() {
  const proj = Project.Current as Project;
  const container = Project.by('container', proj._frameworkVersion);
  if (container) {
    container.run(`code .`).sync();
  } else {
    Helpers.error(`Core container not found...`, false, true);
  }
  process.exit(0)
}
//#endregion

//#region open / core project
function $OPEN_CORE_PROJECT() {
  if ((Project.Current as Project).isCoreProject && (Project.Current as Project).frameworkVersionAtLeast('v2')) {
    (Project.Current as Project).run(`code ${Project.by<Project>((Project.Current as Project)._type, (Project.Current as Project).frameworkVersionMinusOne).location} &`).sync();
  } else {
    (Project.Current as Project).run(`code ${Project.by<Project>((Project.Current as Project)._type, (Project.Current as Project)._frameworkVersion).location} &`).sync();
  }
  process.exit(0)
}
//#endregion

//#region open / tnp project
function $OPEN_TNP_PROJECT() {
  (Project.Tnp as Project).run(`code ${(Project.Tnp as Project).location} &`).sync();
  process.exit(0)
}
//#endregion

//#region open / unstage
async function $OPEN_UNSTAGE() {
  const proj = (Project.Current as Project);
  const libs = proj.childrenThatAreLibs.filter(f => f.git.thereAreSomeUncommitedChangeExcept([
    config.file.package_json,
    config.file.package_json5,
    config.file.package_json__tnp_json5,
  ]));
  libs.forEach(l => l.openInVscode());
  process.exit(0)
}
//#endregion

//#region open / thing..
function openThing(fileName: string) {
  const proj = Project.nearestTo(process.cwd()) as Project;

  const openFn = (pathToTHing) => {
    if (fileName.endsWith('.json')) {
      Helpers.run(`code ${pathToTHing}`, { biggerBuffer: false }).sync();
    } else {
      Helpers.openFolderInFileExploer(pathToTHing);
    }
  };

  if (proj.isStandaloneProject && !proj.isSmartContainerChild) {
    const pathToDB = path.join(proj.location, fileName);
    openFn(pathToDB)
  }

  const smartContainerFn = (project: Project) => {
    const patternPath = `${path.join(project.location, config.folder.dist, project.name)}/*`;
    const folderPathes = glob
      .sync(patternPath);

    const lastFolder = _.first(folderPathes
      .map(f => {
        return {
          folderPath: f, mtimeMs: fse.lstatSync(f).mtimeMs
        }
      })
      .sort((a, b) => {
        if (a.mtimeMs > b.mtimeMs) return 1;
        if (a.mtimeMs < b.mtimeMs) return -1;
        return 0;
      })
    );

    if (!lastFolder) {
      Helpers.error(`Last project not started...

        not porjects here in "${patternPath}"

        `, false, true)
    }

    const pathToTHing = path.join(lastFolder.folderPath, fileName);
    openFn(pathToTHing);
  };

  if (proj.isSmartContainer) {
    smartContainerFn(proj);
  }
  if (proj.isSmartContainerChild) {
    smartContainerFn(proj.parent);
  }
  process.exit(0)
}
//#endregion

//#region open / db
function $OPEN_DB() {
  openThing('tmp-db.sqlite');
}
//#endregion

//#region open / routers
function $OPEN_ROUTES() {
  openThing('tmp-routes.json');
}
//#endregion

//#endregion

//#region other
function $IS_CORE_PROJECT() {
  Helpers.info(`(${(Project.Current as Project).genericName})
  - is core project: ${chalk.bold(String((Project.Current as Project).isCoreProject))}`)
  process.exit(0)
}

function $LOCATION() {
  Helpers.info(`

  ${Project.Tnp.location}

  `);
  process.exit(0)
}

//#endregion

export default {
  $LOCATION: Helpers.CLIWRAP($LOCATION, '$LOCATION'),
  $OPEN: Helpers.CLIWRAP($OPEN, '$OPEN'),
  $OPEN_DB: Helpers.CLIWRAP($OPEN_DB, '$OPEN_DB'),
  $OPEN_ROUTES: Helpers.CLIWRAP($OPEN_ROUTES, '$OPEN_ROUTES'),
  $OPEN_UNSTAGE: Helpers.CLIWRAP($OPEN_UNSTAGE, '$OPEN_UNSTAGE'),
  $IS_CORE_PROJECT: Helpers.CLIWRAP($IS_CORE_PROJECT, '$IS_CORE_PROJECT'),
  $OPEN_CORE_PROJECT: Helpers.CLIWRAP($OPEN_CORE_PROJECT, '$OPEN_CORE_PROJECT'),
  $OPEN_CORE_CONTAINER: Helpers.CLIWRAP($OPEN_CORE_CONTAINER, '$OPEN_CORE_CONTAINER'),
  $OPEN_TNP_PROJECT: Helpers.CLIWRAP($OPEN_TNP_PROJECT, '$OPEN_TNP_PROJECT'),

}
