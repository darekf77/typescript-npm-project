//#region @backend
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import { config } from '../../config';
import { getMostRecentFilesNames, tryCopyFrom, tryRemoveDir } from "../../helpers";
import { Project } from '../base-project';
import { IPackageJSON } from '../../models';
import { TnpDB } from '../../tnp-db';


function checkIfFileTnpFilesUpToDateInDest(destination: string): boolean {
  const tnpDistCompiled = path.join(Project.Tnp.location, config.folder.dist)

  return getMostRecentFilesNames(tnpDistCompiled)
    .map(f => f.replace(tnpDistCompiled, ''))
    .filter(f => {
      const fileInDest = path.join(destination, f)
      const fileInTnp = path.join(tnpDistCompiled, f);

      if (!fs.existsSync(fileInDest)) {
        // console.log(`File ${fileInDest} doesn't exist`)
        return true;
      }

      const res = fs.readFileSync(fileInTnp).toString().trim() !== fs.readFileSync(fileInDest).toString().trim()
      // console.log(`
      //   compare: "${fileInDest}" ${fs.readFileSync(fileInDest).toString().length}
      //   with : "${fileInTnp}" ${fs.readFileSync(fileInTnp).toString().length}
      //   result: ${res}
      // `)
      return res;
    }).length === 0;
}

const notNeededReinstallationTnp = {};



export function reinstallTnp(project: Project,
  pathTnpCompiledJS: string,
  pathTnpPackageJSONData: IPackageJSON) {

  const workspaceLocation = project.isWorkspace ? project.location :
    (project.isWorkspaceChildProject ? project.parent.location : void 0);

  if (!_.isString(workspaceLocation)) {
    return
  }

  if (_.isUndefined(notNeededReinstallationTnp[workspaceLocation])) {
    notNeededReinstallationTnp[workspaceLocation] = 0;
  }

  if (project.isStandaloneProject) {
    return;
  }
  const db = TnpDB.InstanceSync;
  let allowedToRemoveTnpBundleFolder = db.checkIf.allowed.removeTnpBundleFolder(project)
  // console.log('allowedToRemoveTnpBundleFolder', allowedToRemoveTnpBundleFolder)

  if (project.isTnp) {
    return
  }

  if (notNeededReinstallationTnp[workspaceLocation] > 2) {
    console.log('[TNP helper] reinstall not needed')
    return;
  }
  if (!project.isStandaloneProject) {


    const destCompiledJs = path.join(workspaceLocation, config.folder.node_modules, config.file.tnpBundle)


    const destPackageJSON = path.join(workspaceLocation, config.folder.node_modules, config.file.tnpBundle, config.file.package_json)

    if (fs.existsSync(destCompiledJs) && allowedToRemoveTnpBundleFolder) {
      // console.log(`Removed tnp - helper from ${ dest } `)
      tryRemoveDir(destCompiledJs)
    }

    tryCopyFrom(`${pathTnpCompiledJS}/`, destCompiledJs, {
      filter: (src: string, dest: string) => {
        return !src.endsWith('/dist/bin') &&
          !src.endsWith('/bin') &&
          !/.*node_modules.*/g.test(src);
      }
    });

    fse.writeJsonSync(destPackageJSON, pathTnpPackageJSONData, {
      encoding: 'utf8',
      spaces: 2
    })

    const sourceTnpPath = path.join(Project.Tnp.location, config.file.tnp_system_path_txt);
    const destTnpPath = path.join(workspaceLocation, config.folder.node_modules,
      config.file.tnpBundle, config.file.tnp_system_path_txt)

    fse.copyFileSync(sourceTnpPath, destTnpPath);

    let lastTwo = _.first(pathTnpCompiledJS.match(/\/[a-zA-Z0-9\-\_]+\/[a-zA-Z0-9\-\_]+\/?$/));
    // console.info(`** tnp-bundle reinstalled from ${lastTwo}`)

    if (_.isUndefined(notNeededReinstallationTnp[workspaceLocation])) {
      notNeededReinstallationTnp[workspaceLocation] = 1;
    } else {
      ++notNeededReinstallationTnp[workspaceLocation];
    }

    console.log(`Tnp-helper installed in ${project.name} from ${lastTwo} , installs counter:${notNeededReinstallationTnp[workspaceLocation]} `)
  } else {
    // warn(`Standalone project "${project.name}" - ${chalk.bold('tnp')} is not goint be not installed.`)
  }
}
//#endregion
