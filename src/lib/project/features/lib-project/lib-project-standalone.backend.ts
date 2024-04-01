//#region imports
import { CLI } from "tnp-cli/src";
import { config } from "tnp-config/src";
import { crossPlatformPath, path, _ } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { AppBuildConfig } from "../../features/docs-app-build-config.backend";
import { LibPorjectBase } from "./lib-project-base.backend";
import { Project } from "../../abstract/project";
import { Models } from "../../../models";
import { TEMP_DOCS } from "../../../constants";
import { BuildOptions } from "../../../../cli";
//#endregion

export class LibProjectStandalone extends LibPorjectBase {

  //#region prepare package
  preparePackage(smartContainer: Project, newVersion: string) {
    const base = path.join(
      this.project.location,
      config.folder.dist,
    );

    this.project.__removeJsMapsFrom(base);
  }
  //#endregion

  //#region  fix package.json
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

    this.project.__packageJson.showDeps(`after release show when ok`);
    if (this.project.__packageJson.data.tnp.libReleaseOptions.cliBuildIncludeNodeModules) {
      // this.lib.packageJson.clearForRelase('dist');
    } else {
      //#region copy packagejson before relase (beacuse it may be link)
      const packageJsonInDistReleasePath = path.join(this.project.location, config.folder.dist, config.file.package_json);
      const orgPj = Helpers.readFile(packageJsonInDistReleasePath);
      Helpers.removeFileIfExists(packageJsonInDistReleasePath);
      Helpers.writeFile(packageJsonInDistReleasePath, orgPj);
      //#endregion

      if (this.project.__packageJson.name === 'tnp') {  // TODO QUICK_FIX
        Helpers.setValueToJSON(path.join(this.project.location, config.folder.dist, config.file.package_json), 'dependencies',
          Project.ins.Tnp.__packageJson.data.tnp.overrided.includeOnly.reduce((a, b) => {
            return _.merge(a, {
              [b]: Project.ins.Tnp.__packageJson.data.dependencies[b]
            })
          }, {})
        );
      } else {
        Helpers.setValueToJSON(packageJsonInDistReleasePath, 'devDependencies', {});
        // QUICK FIX include only
        const includeOnly = realCurrentProj.__packageJson.data.tnp?.overrided?.includeOnly || [];
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
  //#endregion

  //#region build docs
  async buildDocs(prod: boolean, realCurrentProj: Project, automaticReleaseDocs: boolean, libBuildCallback: (websql: boolean, prod: boolean) => any): Promise<boolean> {

    //#region resovle variables
    const mainProjectName = realCurrentProj.name;
    let appBuildOptions = { docsAppInProdMode: prod, websql: false };
    //#endregion

    return await Helpers.questionYesNo(this.messages.docsBuildQuesions, async () => {

      //#region questions
      if (automaticReleaseDocs) {
        appBuildOptions = {
          docsAppInProdMode: realCurrentProj.__docsAppBuild.config.prod,
          websql: realCurrentProj.__docsAppBuild.config.websql,
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

      realCurrentProj.__docsAppBuild.save(cfg);

      Helpers.log(`

      Building /docs folder preview app - start

      `);
      //#endregion

      await Helpers.runSyncOrAsync({ functionFn: libBuildCallback });

      await this.project.build(BuildOptions.from({
        buildType: 'app',
        prod: appBuildOptions.docsAppInProdMode,
        websql: appBuildOptions.websql,
      }));

      realCurrentProj.git.revertFileChanges('docs/CNAME');

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
        realCurrentProj.__assetsFileListGenerator.filename,
      ])
      const assetsListPathDestMain = crossPlatformPath([
        realCurrentProj.location,
        config.folder.docs,
        config.folder.assets,
        realCurrentProj.__assetsFileListGenerator.filename,
      ]);
      // console.log({
      //   assetsListPathSourceMain,
      //   assetsListPathDestMain,
      // })
      Helpers.copyFile(assetsListPathSourceMain, assetsListPathDestMain);

      Helpers.log(this.messages.docsBuildDone);
    });
  }
  //#endregion

  //#region publis
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

    const existedReleaseDist = crossPlatformPath([this.project.location, this.project.__getTempProjName('dist'), config.folder.node_modules, realCurrentProj.name]);
    Helpers.info(`Publish cwd: ${existedReleaseDist}`)
    await Helpers.questionYesNo(`Publish on npm version: ${newVersion} ?`, async () => {

      // publishing standalone
      try {
        Helpers.run('npm publish', {
          cwd: existedReleaseDist,
          output: true
        }).sync();
      } catch (e) {
        this.project.__removeTagAndCommit(automaticRelease)
      }


      // release additional packages names
      const names = this.project.__packageJson.additionalNpmNames;
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
        const packageJsonAdd: Models.IPackageJSON = Helpers.readJson(path.join(additionBase, config.file.package_json));
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
  //#endregion

  //#region update core/special projects/container
  updateTnpAndCoreContainers(realCurrentProj: Project) {
    //#region @notForNpm
    const tnpProj = Project.ins.Tnp;

    const updateLocalFiredevProjectWithOwnNodeModules = (config.frameworkName === 'tnp')
      && (realCurrentProj.name !== 'tnp')
      && (realCurrentProj.__frameworkVersion === tnpProj.__frameworkVersion);


    const coreCont = Project.by('container', realCurrentProj.__frameworkVersion) as Project;

    const arrTrusted = tnpProj.__packageJson.data.tnp.core.dependencies.trusted[this.project.__frameworkVersion];
    if (
      (_.isString(arrTrusted) && (arrTrusted === '*')) ||
      (_.isArray(arrTrusted) && arrTrusted.includes(this.project.name))
    ) {
      [
        ...(updateLocalFiredevProjectWithOwnNodeModules ? [tnpProj] : []),
        coreCont,
      ].filter(f => !!f)
        .forEach(c => {
          c.__smartNodeModules.updateFromReleaseDist(realCurrentProj);
        });
    }


    //#endregion
  }
  //#endregion

  //#region bump version in other projects
  /**
   * Return how many projects has changed
   * @param bumbVersionIn
   * @param newVersion
   * @param onlyInThisProjectSubprojects
   */
  async bumpVersionInOtherProjects(newVersion, onlyInThisProjectSubprojects = false) {
    if (onlyInThisProjectSubprojects) {
      // console.log('UPDATE VERSION !!!!!!!!!!!!!')
      updateChildrenVersion(this.project, newVersion, this.project.name);
    } else {
      if (Project.ins.Tnp.name === this.project.name) {
        Helpers.info(`Ommiting version bump ${this.project.name} - for ${config.frameworkName} itself`)
      } else if (this.project.__packageJson.hasDependency(Project.ins.Tnp.name)) {
        Helpers.info(`Ommiting version bump ${this.project.name} - has ${config.frameworkName} as dependency`)
      } else {
        Project.ins.Tnp.__packageJson.setDependencyAndSave({
          name: this.project.name,
          version: newVersion,
        }, `Bump new version "${newVersion}" of ${this.project.name}`);
      }
    }
  }
  //#endregion

}

//#region update children version
function updateChildrenVersion(project: Project, newVersion, name, updatedProjectw: Project[] = []) {
  if (updatedProjectw.filter(p => p.location === project.location).length > 0) {
    Helpers.log(`[release - ${name}][lib-proj] Alredy update ${project.genericName}`)
    return;
  }
  if (project.name !== name) {
    project.__packageJson.setDependencyAndSave({
      name,
      version: newVersion
    }, `Bump versoin of library ${name}`);
  } else {
    project.__packageJson.data.version = newVersion;
    project.__packageJson.save(`[lib-proj] set version`);
  }
  updatedProjectw.push(project);
  Helpers.log(`[release - ${name}][lib-proj] children of ${project.genericName}: \n${project.children.map(c => c.location)}\n`)
  project.children.forEach(childProject => updateChildrenVersion(childProject, newVersion, name, updatedProjectw));
}
//#endregion
