import { CLI } from "tnp-cli";
import { config } from "tnp-config";
import { crossPlatformPath, path, _ } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { LibPorjectBase } from "./lib-project-base.backend";
import { Project } from "./project";


export class LibProjectStandalone extends LibPorjectBase {

  preparePackage(smartContainer: Project, newVersion: string) {
    const base = path.join(
      this.lib.location,
      config.folder.bundle,
    );

    this.lib.removeJsMapsFrom(base);
  }

  fixPackageJson(realCurrentProj: Project) {
    // [
    //   // config.folder.browser, /// TODO FIX for typescript
    //   config.folder.client,
    //   '',
    // ].forEach(c => {
    //   const pjPath = path.join(this.lib.location, config.folder.bundle, c, config.file.package_json);
    //   const content = Helpers.readJson(pjPath);
    //   Helpers.remove(pjPath);
    //   Helpers.writeFile(pjPath, content);
    // });

    this.lib.packageJson.showDeps(`after release show when ok`);
    if (this.lib.packageJson.data.tnp.libReleaseOptions.includeNodeModules) {
      // this.lib.packageJson.clearForRelase('bundle');
    } else {
      //#region copy packagejson before relase (beacuse it may be link)
      const packageJsonInBundlePath = path.join(this.lib.location, config.folder.bundle, config.file.package_json);
      const orgPj = Helpers.readFile(packageJsonInBundlePath);
      Helpers.removeFileIfExists(packageJsonInBundlePath);
      Helpers.writeFile(packageJsonInBundlePath, orgPj);
      //#endregion

      if (this.lib.packageJson.name === 'tnp') {  // TODO QUICK_FIX
        Helpers.setValueToJSON(path.join(this.lib.location, config.folder.bundle, config.file.package_json), 'dependencies',
          this.lib.TnpProject.packageJson.data.tnp.overrided.includeOnly.reduce((a, b) => {
            return _.merge(a, {
              [b]: this.lib.TnpProject.packageJson.data.dependencies[b]
            })
          }, {})
        );
      } else {
        Helpers.setValueToJSON(packageJsonInBundlePath, 'devDependencies', {});
        // QUICK FIX include only
        const includeOnly = realCurrentProj.packageJson.data.tnp?.overrided?.includeOnly || [];
        const dependencies = Helpers.readJson(packageJsonInBundlePath, {}).dependencies || {};
        Object.keys(dependencies).forEach(packageName => {
          if (!includeOnly.includes(packageName)) {
            delete dependencies[packageName];
          }
        });
        Helpers.setValueToJSON(packageJsonInBundlePath, 'dependencies', dependencies);
      }
    }

  }

  async buildDocs(prod: boolean) {
    await Helpers.questionYesNo(`Do you wanna build docs for github preview`, async () => {

      //#region questions
      let appBuildOptions = { docsAppInProdMode: prod, websql: false };

      await Helpers.questionYesNo(`Do you wanna build in production mode`, () => {
        appBuildOptions.docsAppInProdMode = true;
      }, () => {
        appBuildOptions.docsAppInProdMode = false;
      });

      await Helpers.questionYesNo(`Do you wanna use websql mode ?`, () => {
        appBuildOptions.websql = true;
      }, () => {
        appBuildOptions.websql = false;
      });

      Helpers.log(`

      Building docs prevew - start

      `);
      //#endregion

      const libBuildCommand = `${config.frameworkName} build:${config.folder.bundle} ${global.hideLog ? '' : '-verbose'} && `
      await this.lib.run(`${libBuildCommand}`
        + `${config.frameworkName} build:${config.folder.bundle}:app${appBuildOptions.docsAppInProdMode ? 'prod' : ''} `
        + `${appBuildOptions.websql ? '--websql' : ''} ${global.hideLog ? '' : '-verbose'}`).sync();


      Helpers.log(`

      Building docs prevew - done

      `);
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

    const cwd = path.join(this.lib.location, config.folder.bundle)
    Helpers.info(`Publish cwd: ${cwd}`)
    await Helpers.questionYesNo(`Publish on npm version: ${newVersion} ?`, async () => {

      // publishing standalone
      try {
        this.lib.run('npm publish', {
          cwd,
          output: true
        }).sync();
      } catch (e) {
        this.lib.removeTagAndCommit(automaticRelease)
      }


      // release additional packages names
      const names = this.lib.packageJson.additionalNpmNames;
      for (let index = 0; index < names.length; index++) {
        const c = names[index];
        const existedBundle = crossPlatformPath(path.join(this.lib.location, 'bundle'));
        const additionBase = crossPlatformPath(path.resolve(path.join(this.lib.location, `../../../additional-bundle-${c}`)));
        Helpers.mkdirp(additionBase);
        Helpers.copy(existedBundle, additionBase, {
          copySymlinksAsFiles: true,
          omitFolders: [config.folder.node_modules],
          omitFoldersBaseFolder: existedBundle
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
        Helpers.info('log addtional bundle created');
        try {
          if (!global.tnpNonInteractive) {
            Helpers.run(`code ${additionBase}`).sync();
            Helpers.info(`Check you additional bundle for ${CLI.chalk.bold(c)} and press any key to publish...`);
            Helpers.pressKeyAndContinue();
          }
          Helpers.run('npm publish', { cwd: additionBase }).sync();
        } catch (error) {
          Helpers.warn(`No able to push additional bundle for name: ${c}`)
        }
      }


      await this.bumpVersionInOtherProjects(newVersion);
      this.updateTnpAndCoreContainers(realCurrentProj);
    });

  }

  updateTnpAndCoreContainers(realCurrentProj: Project) {
    //#region @notForNpm
    const tnpProj = Project.Tnp as Project;

    if (tnpProj && config.frameworkName === 'tnp') {
      tnpProj.packageJson.save('showing for trusted')

      let firedeProj: Project;
      if (this.lib.packageJson.name === config.frameworkNames.tnp) {  // TODO QUICK_FIX
        firedeProj = Project.From(path.join(path.dirname(realCurrentProj.location), config.frameworkNames.firedev))
      }
      const coreCont = Project.by('container', realCurrentProj._frameworkVersion) as Project;

      const arrTrusted = tnpProj.packageJson.data.tnp.core.dependencies.trusted[this.lib._frameworkVersion];
      if (
        (_.isString(arrTrusted) && (arrTrusted === '*')) ||
        (_.isArray(arrTrusted) && arrTrusted.includes(this.lib.name))
      ) {
        [
          firedeProj,
          tnpProj,
          coreCont,
        ].filter(f => !!f)
          .forEach(c => {
            c.smartNodeModules.updateFromReleaseBundle(realCurrentProj);
          });
      }


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
      updateChildrenVersion(this.lib, newVersion, this.lib.name);
    } else {
      if (this.lib.TnpProject.name === this.lib.name) {
        Helpers.info(`Ommiting version bump ${this.lib.name} - for ${config.frameworkName} itself`)
      } else if (this.lib.packageJson.hasDependency(this.lib.TnpProject.name)) {
        Helpers.info(`Ommiting version bump ${this.lib.name} - has ${config.frameworkName} as dependency`)
      } else {
        this.lib.TnpProject.packageJson.setDependencyAndSave({
          name: this.lib.name,
          version: newVersion,
        }, `Bump new version "${newVersion}" of ${this.lib.name}`);
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

