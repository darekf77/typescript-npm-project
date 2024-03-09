import { CLI } from "tnp-cli/src";
import { config } from "tnp-config/src";
import { crossPlatformPath, path, _ } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { Models } from "tnp-models/src";
import { AppBuildConfig } from "../../features/docs-app-build-config.backend";
import { LibPorjectBase } from "./lib-project-base.backend";
import { Project } from "./project";
import { TEMP_DOCS } from "../../../constants";


export class LibProjectStandalone extends LibPorjectBase {

  preparePackage(smartContainer: Project, newVersion: string) {
    const base = path.join(
      this.project.location,
      config.folder.dist,
    );

    this.project.removeJsMapsFrom(base);
  }

  fixPackageJson(realCurrentProj: Project) {
    // [
    //   // config.folder.browser, /// TODO FIX for typescript
    //   config.folder.client,
    //   '',
    // ].forEach(c => {
    //   const pjPath = path.join(this.lib.location, config.folder.dist, c, config.file.package_json);
    //   const content = Helpers.readJson(pjPath);
    //   Helpers.remove(pjPath);
    //   Helpers.writeFile(pjPath, content);
    // });

    this.project.packageJson.showDeps(`after release show when ok`);
    if (this.project.packageJson.data.tnp.libReleaseOptions.includeNodeModules) {
      // this.lib.packageJson.clearForRelase('dist');
    } else {
      //#region copy packagejson before relase (beacuse it may be link)
      const packageJsonInDistReleasePath = path.join(this.project.location, config.folder.dist, config.file.package_json);
      const orgPj = Helpers.readFile(packageJsonInDistReleasePath);
      Helpers.removeFileIfExists(packageJsonInDistReleasePath);
      Helpers.writeFile(packageJsonInDistReleasePath, orgPj);
      //#endregion

      if (this.project.packageJson.name === 'tnp') {  // TODO QUICK_FIX
        Helpers.setValueToJSON(path.join(this.project.location, config.folder.dist, config.file.package_json), 'dependencies',
          this.project.TnpProject.packageJson.data.tnp.overrided.includeOnly.reduce((a, b) => {
            return _.merge(a, {
              [b]: this.project.TnpProject.packageJson.data.dependencies[b]
            })
          }, {})
        );
      } else {
        Helpers.setValueToJSON(packageJsonInDistReleasePath, 'devDependencies', {});
        // QUICK FIX include only
        const includeOnly = realCurrentProj.packageJson.data.tnp?.overrided?.includeOnly || [];
        const dependencies = Helpers.readJson(packageJsonInDistReleasePath, {}).dependencies || {};
        Object.keys(dependencies).forEach(packageName => {
          if (!includeOnly.includes(packageName)) {
            delete dependencies[packageName];
          }
        });
        Helpers.setValueToJSON(packageJsonInDistReleasePath, 'dependencies', dependencies);
      }
    }

  }

  async buildDocs(prod: boolean, realCurrentProj: Project, automaticReleaseDocs: boolean, libBuildCallback: (websql: boolean, prod: boolean) => any): Promise<boolean> {
    return await Helpers.questionYesNo(this.messages.docsBuildQuesions, async () => {
      const mainProjectName = realCurrentProj.name;
      //#region questions
      let appBuildOptions = { docsAppInProdMode: prod, websql: false };

      if (automaticReleaseDocs) {
        appBuildOptions = {
          docsAppInProdMode: realCurrentProj.docsAppBuild.config.prod,
          websql: realCurrentProj.docsAppBuild.config.websql,
        }
      }

      if (!automaticReleaseDocs) {
        await Helpers.questionYesNo(this.messages.productionMode, () => {
          appBuildOptions.docsAppInProdMode = true;
        }, () => {
          appBuildOptions.docsAppInProdMode = false;
        });


        await Helpers.questionYesNo(`Do you wanna use websql mode ?`, () => {
          appBuildOptions.websql = true;
        }, () => {
          appBuildOptions.websql = false;
        });
      }

      const cfg: AppBuildConfig = {
        build: true,
        prod: appBuildOptions.docsAppInProdMode,
        websql: appBuildOptions.websql,
        projName: mainProjectName,
      };

      realCurrentProj.docsAppBuild.save(cfg);

      Helpers.log(`

      Building /docs folder preview app - start

      `);
      //#endregion


      await Helpers.runSyncOrAsync(libBuildCallback);

      const libBuildCommand = ''; // `${config.frameworkName} build:${config.folder.dist} ${global.hideLog ? '' : '-verbose'} && `
      await this.project.run(`${libBuildCommand}`
        + `${config.frameworkName} build:${config.folder.dist}:app:${appBuildOptions.docsAppInProdMode ? 'prod' : ''} `
        + `${appBuildOptions.websql ? '--websql' : ''} ${global.hideLog ? '' : '-verbose'} --forAppRelaseBuild`).sync();

      try {
        realCurrentProj.run('git checkout docs/CNAME').sync();
      } catch (error) { }

      const tempDocs = realCurrentProj.pathFor(TEMP_DOCS);
      const docsIndocs = realCurrentProj.pathFor('docs/documentation');
      if (Helpers.exists(tempDocs)) {
        Helpers.copy(tempDocs, docsIndocs);
      }

      const assetsListPathSourceMain = crossPlatformPath([
        realCurrentProj.location,
        `tmp-dist-release/${config.folder.dist}/project/${realCurrentProj.name}`,
        `tmp-apps-for-${config.folder.dist}${appBuildOptions.websql ? '-websql' : ''}`,
        realCurrentProj.name,
        config.folder.src,
        config.folder.assets,
        realCurrentProj.assetsFileListGenerator.filename,
      ])
      const assetsListPathDestMain = crossPlatformPath([
        realCurrentProj.location,
        config.folder.docs,
        config.folder.assets,
        realCurrentProj.assetsFileListGenerator.filename,
      ]);
      // console.log({
      //   assetsListPathSourceMain,
      //   assetsListPathDestMain,
      // })
      Helpers.copyFile(assetsListPathSourceMain, assetsListPathDestMain);

      Helpers.log(this.messages.docsBuildDone);
    });
  }


  async publish(options: {
    realCurrentProj: Project,
    newVersion: string,
    automaticRelease: boolean,
    prod: boolean,
  }) {

    const {
      realCurrentProj,
      newVersion,
      automaticRelease,
      prod,
    } = options;

    const existedReleaseDist = crossPlatformPath([this.project.location, this.project.getTempProjName('dist'), config.folder.node_modules, realCurrentProj.name]);
    Helpers.info(`Publish cwd: ${existedReleaseDist}`)
    await Helpers.questionYesNo(`Publish on npm version: ${newVersion} ?`, async () => {

      // publishing standalone
      try {
        this.project.run('npm publish', {
          cwd: existedReleaseDist,
          output: true
        }).sync();
      } catch (e) {
        this.project.removeTagAndCommit(automaticRelease)
      }


      // release additional packages names
      const names = this.project.packageJson.additionalNpmNames;
      for (let index = 0; index < names.length; index++) {
        const c = names[index];
        const additionBase = crossPlatformPath(path.resolve(path.join(this.project.location, `../../../additional-dist-${c}`)));
        Helpers.mkdirp(additionBase);
        Helpers.copy(existedReleaseDist, additionBase, {
          copySymlinksAsFiles: true,
          omitFolders: [config.folder.node_modules],
          omitFoldersBaseFolder: existedReleaseDist
        });
        const pathPackageJsonRelease = path.join(additionBase, config.file.package_json);
        const packageJsonAdd: Models.npm.IPackageJSON = Helpers.readJson(path.join(additionBase, config.file.package_json));
        packageJsonAdd.name = c;
        // const keys = Object.keys(packageJsonAdd.bin || {});
        // keys.forEach(k => {
        //   const v = packageJsonAdd.bin[k] as string;
        //   packageJsonAdd.bin[k.replace(this.name, c)] = v.replace(this.name, c);
        //   delete packageJsonAdd.bin[k];
        // });
        Helpers.writeFile(pathPackageJsonRelease, packageJsonAdd);
        Helpers.info('log addtional dist created');
        try {
          if (!global.tnpNonInteractive) {
            Helpers.run(`code ${additionBase}`).sync();
            Helpers.info(`Check you additional dist for ${CLI.chalk.bold(c)} and press any key to publish...`);
            Helpers.pressKeyAndContinue();
          }
          Helpers.run('npm publish', { cwd: additionBase }).sync();
        } catch (error) {
          Helpers.warn(`No able to push additional dist for name: ${c}`)
        }
      }


      await this.bumpVersionInOtherProjects(newVersion);
      this.updateTnpAndCoreContainers(realCurrentProj);
    });

  }

  updateTnpAndCoreContainers(realCurrentProj: Project) {
    //#region @notForNpm
    const tnpProj = Project.Tnp as Project;

    const updateLocalTnpProjectWithOwnNodeModules = (config.frameworkName === 'tnp')
      && (realCurrentProj.name !== 'tnp')
      && (realCurrentProj._frameworkVersion === tnpProj._frameworkVersion);


    const coreCont = Project.by('container', realCurrentProj._frameworkVersion) as Project;

    const arrTrusted = tnpProj.packageJson.data.tnp.core.dependencies.trusted[this.project._frameworkVersion];
    if (
      (_.isString(arrTrusted) && (arrTrusted === '*')) ||
      (_.isArray(arrTrusted) && arrTrusted.includes(this.project.name))
    ) {
      [
        ...(updateLocalTnpProjectWithOwnNodeModules ? [tnpProj] : []),
        coreCont,
      ].filter(f => !!f)
        .forEach(c => {
          c.smartNodeModules.updateFromReleaseDist(realCurrentProj);
        });
    }


    //#endregion
  }


  /**
   * Return how many projects has changed
   * @param bumbVersionIn
   * @param newVersion
   * @param onlyInThisProjectSubprojects
   */ // @ts-ignore
  async bumpVersionInOtherProjects(newVersion, onlyInThisProjectSubprojects = false) {
    if (onlyInThisProjectSubprojects) {
      // console.log('UPDATE VERSION !!!!!!!!!!!!!')
      updateChildrenVersion(this.project, newVersion, this.project.name);
    } else {
      if (this.project.TnpProject.name === this.project.name) {
        Helpers.info(`Ommiting version bump ${this.project.name} - for ${config.frameworkName} itself`)
      } else if (this.project.packageJson.hasDependency(this.project.TnpProject.name)) {
        Helpers.info(`Ommiting version bump ${this.project.name} - has ${config.frameworkName} as dependency`)
      } else {
        this.project.TnpProject.packageJson.setDependencyAndSave({
          name: this.project.name,
          version: newVersion,
        }, `Bump new version "${newVersion}" of ${this.project.name}`);
      }
    }
  }


}


export function updateChildrenVersion(project: Project, newVersion, name, updatedProjectw: Project[] = []) {
  if (updatedProjectw.filter(p => p.location === project.location).length > 0) {
    Helpers.log(`[release - ${name}][lib-proj] Alredy update ${project.genericName}`)
    return;
  }
  if (project.name !== name) {
    project.packageJson.setDependencyAndSave({
      name,
      version: newVersion
    }, `Bump versoin of library ${name}`);
  } else {
    project.packageJson.data.version = newVersion;
    project.packageJson.save(`[lib-proj] set version`);
  }
  updatedProjectw.push(project);
  Helpers.log(`[release - ${name}][lib-proj] children of ${project.genericName}: \n${project.children.map(c => c.location)}\n`)
  project.children.forEach(childProject => updateChildrenVersion(childProject, newVersion, name, updatedProjectw));
}
