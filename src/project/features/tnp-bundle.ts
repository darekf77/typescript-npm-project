//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as sleep from 'sleep';

import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Project } from '../abstract';
import { Models } from 'tnp-models';
import { FeatureForProject } from '../abstract';

export class TnpBundle extends FeatureForProject {

  private notNeededReinstallationTnp = {};

  private reinstallCounter = 1;

  public installAsPackage() {

    if (!Project.Tnp) {
      console.trace(`** ERR Project.Tnp not available yet`)
    }

    let pathTnpCompiledJS = path.join(Project.Tnp.location, config.folder.dist);
    if (!fse.existsSync(pathTnpCompiledJS)) {
      pathTnpCompiledJS = path.join(Project.Tnp.location, config.folder.bundle);
    }
    const pathTnpPackageJSONData: Models.npm.IPackageJSON = fse.readJsonSync(path.join(Project.Tnp.location, config.file.package_json)) as any;

    pathTnpPackageJSONData.name = config.file.tnpBundle;
    pathTnpPackageJSONData.tnp = undefined;
    pathTnpPackageJSONData.bin = undefined;
    pathTnpPackageJSONData.main = undefined;
    pathTnpPackageJSONData.preferGlobal = undefined;
    pathTnpPackageJSONData.dependencies = undefined;
    pathTnpPackageJSONData.devDependencies = undefined;

    this.reinstallTnp(this.project, pathTnpCompiledJS, pathTnpPackageJSONData)
  }


  checkIfFileTnpFilesUpToDateInDest(destination: string): boolean {
    const tnpDistCompiled = path.join(Project.Tnp.location, config.folder.dist)

    return Helpers.getMostRecentFilesNames(tnpDistCompiled)
      .map(f => f.replace(tnpDistCompiled, ''))
      .filter(f => {
        const fileInDest = path.join(destination, f)
        const fileInTnp = path.join(tnpDistCompiled, f);

        if (!fse.existsSync(fileInDest)) {
          // console.log(`File ${fileInDest} doesn't exist`)
          return true;
        }

        const res = Helpers.readFile(fileInTnp).trim() !== Helpers.readFile(fileInDest).trim()
        console.log(`
          compare: "${fileInDest}" ${Helpers.readFile(fileInDest).toString().length}
          with : "${fileInTnp}" ${Helpers.readFile(fileInTnp).toString().length}
          result: ${res}
        `)
        return res;
      }).length === 0;
  }


  private reinstallTnp(project: Project,
    pathTnpCompiledJS: string,
    pathTnpPackageJSONData: Models.npm.IPackageJSON) {

    const workspaceOrStandaloneLocation = (project.isWorkspace || project.isStandaloneProject) ? project.location :
      (project.isWorkspaceChildProject ? project.parent.location : void 0);

    if (!_.isString(workspaceOrStandaloneLocation)) {
      return;
    }

    if (_.isUndefined(this.notNeededReinstallationTnp[workspaceOrStandaloneLocation])) {
      this.notNeededReinstallationTnp[workspaceOrStandaloneLocation] = 0;
    }



    if (project.isTnp) {
      return
    }

    if (this.notNeededReinstallationTnp[workspaceOrStandaloneLocation] > 2) {
      Helpers.log('[TNP helper] reinstall not needed')
      return;
    }



    const destCompiledJs = path.join(workspaceOrStandaloneLocation, config.folder.node_modules, config.file.tnpBundle)


    const destPackageJSON = path.join(workspaceOrStandaloneLocation, config.folder.node_modules, config.file.tnpBundle, config.file.package_json)


    Helpers.tryCopyFrom(`${pathTnpCompiledJS}/`, destCompiledJs, {
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
    const destTnpPath = path.join(workspaceOrStandaloneLocation, config.folder.node_modules,
      config.file.tnpBundle, config.file.tnp_system_path_txt)

    fse.copyFileSync(sourceTnpPath, destTnpPath);

    let lastTwo = _.first(pathTnpCompiledJS.match(/\/[a-zA-Z0-9\-\_]+\/[a-zA-Z0-9\-\_]+\/?$/));
    // console.info(`** tnp-bundle reinstalled from ${lastTwo}`)

    if (_.isUndefined(this.notNeededReinstallationTnp[workspaceOrStandaloneLocation])) {
      this.notNeededReinstallationTnp[workspaceOrStandaloneLocation] = 1;
    } else {
      ++this.notNeededReinstallationTnp[workspaceOrStandaloneLocation];
    }

    Helpers.log(`Tnp-helper installed in ${project.name} from ${lastTwo} , `
      + `installs counter:${this.notNeededReinstallationTnp[workspaceOrStandaloneLocation]} `)

  }

}

 //#endregion
