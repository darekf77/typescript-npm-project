//#region @backend
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import chalk from 'chalk';
import { FeatureForProject } from "../abstract";
import { Helpers } from "../../helpers";
import { config } from "../../config";
import { Models } from "../../models";

export class QuickFixes extends FeatureForProject {

  public badNpmPackages() {
    Helpers.log(`Fixing bad npm packages - START for ${this.project.genericName}`);
    if (this.project.isGenerated && this.project.isWorkspace) {
      this.project.origin.node_modules.fixesForNodeModulesPackages
        .forEach(f => {
          const source = path.join(this.project.origin.location, f);
          const dest = path.join(this.project.location, f);
          if (fse.existsSync(dest)) {
            Helpers.tryRemoveDir(dest);
          }
          Helpers.tryCopyFrom(source, dest);
        });
    }
    if (this.project.isSite && this.project.isWorkspace) {
      this.project.baseline.node_modules.fixesForNodeModulesPackages
        .forEach(f => {
          const source = path.join(this.project.baseline.location, f);
          const dest = path.join(this.project.location, f);
          if (fse.existsSync(dest)) {
            Helpers.tryRemoveDir(dest);
          }
          Helpers.tryCopyFrom(source, dest);
        });
    }
    Helpers.log(`Fixing bad npm packages - COMPLETE`);
  }

  public missingLibs(missingLibsNames: string[] = []) {
    missingLibsNames.forEach(missingLibName => {
      const pathInProjectNodeModules = path.join(this.project.location, config.folder.node_modules, missingLibName)
      if (fse.existsSync(pathInProjectNodeModules)) {
        Helpers.warn(`Package "${missingLibName}" will replaced with empty package mock.`)
      }
      rimraf.sync(pathInProjectNodeModules);
      fse.mkdirpSync(pathInProjectNodeModules);

      fse.writeFileSync(path.join(pathInProjectNodeModules, 'index.js'), ` export default { } `, 'utf8');
      fse.writeFileSync(path.join(pathInProjectNodeModules, config.file.package_json), JSON.stringify({
        name: missingLibName,
        version: "0.0.0"
      } as Models.npm.IPackageJSON), 'utf8');

    })
  }

  public missingSourceFolders() { /// QUCIK_FIX make it more generic
    if (!fse.existsSync(this.project.location)) {
      return;
    }
    if (this.project.isWorkspace ||
      this.project.isWorkspaceChildProject ||
      this.project.isStandaloneProject) {


      const srcFolder = path.join(this.project.location, config.folder.src);
      if (!this.project.isWorkspace) {
        if (!fse.existsSync(srcFolder)) {
          fse.mkdirpSync(srcFolder);
        }
        // log('SRC folder recreated')

      }
      const componentsFolder = path.join(this.project.location, config.folder.components);
      const browserStandaloneFolder = path.join(this.project.location, config.folder.browser);
      if (this.project.type === 'angular-lib' && !fse.existsSync(componentsFolder)) {
        // log('COMPONENTS folder recreated');
        fse.mkdirpSync(componentsFolder);
      }

      if (this.project.type === 'angular-lib' && this.project.isStandaloneProject
        && !fse.existsSync(browserStandaloneFolder)) {
        // log('BROWSER folder recreated');
        fse.symlinkSync(this.project.location, path.join(this.project.location, config.folder.browser));
      }

      const customFolder = path.join(this.project.location, config.folder.custom);
      if (this.project.isSite && !fse.existsSync(customFolder)) {
        // log('CUSTOM folder recreated');
        fse.mkdirpSync(customFolder);
      }

      const nodeModulesFolder = path.join(this.project.location, config.folder.node_modules);
      if (this.project.isWorkspace && !fse.existsSync(nodeModulesFolder)) {
        // log('NODE_MODULES folder recreated');
        fse.mkdirpSync(nodeModulesFolder)
      }
      if (this.project.isWorkspaceChildProject && !fse.existsSync(nodeModulesFolder)) {
        const paretnFolderOfNodeModules = path.join(this.project.parent.location, config.folder.node_modules);
        if (!fse.existsSync(paretnFolderOfNodeModules)) {
          // log('NODE_MODULES (parent) folder recreated');
          fse.mkdirpSync(paretnFolderOfNodeModules)
        }
        // log('NODE_MODULES folder link to child recreated');
        Helpers.createSymLink(paretnFolderOfNodeModules, nodeModulesFolder);
      }

      if (this.project.isSite) {
        if (this.project.isWorkspace) {
          const baselineFolderInNodeModule = path.join(
            this.project.location,
            config.folder.node_modules,
            this.project.baseline.name
          );
          if (!fse.existsSync(baselineFolderInNodeModule)) {
            // log('BASELINE folder in NODE_MODUELS recreated');
            Helpers.createSymLink(this.project.baseline.location, baselineFolderInNodeModule);
          }
        }
      }

    }
  }

  private get nodeModulesReplacements() {
    const npmReplacements = glob
      .sync(`${this.project.location} /${config.folder.node_modules}-*.zip`)
      .map(p => p.replace(this.project.location, '').slice(1));

    return npmReplacements;
  }

  /**
   * FIX for missing npm packages from npmjs.com
   *
   * Extract each file: node_modules-<package Name>.zip
   * to node_modules folder before instalation.
   * This will prevent packages deletion from npm
   */
  public nodeModulesPackagesZipReplacement() {
    if (!this.project.isWorkspace) {
      return;
    }
    const nodeModulesPath = path.join(this.project.location, config.folder.node_modules);

    if (!fse.existsSync(nodeModulesPath)) {
      fse.mkdirpSync(nodeModulesPath)
    }
    this.nodeModulesReplacements.forEach(p => {
      const name = p.replace(`${config.folder.node_modules}-`, '');
      const moduleInNodeMdules = path.join(this.project.location, config.folder.node_modules, name);
      if (fse.existsSync(moduleInNodeMdules)) {
        Helpers.info(`Extraction ${chalk.bold(name)} already exists in ` +
          ` ${chalk.bold(this.project.genericName)}/${config.folder.node_modules}`);
      } else {
        Helpers.info(`Extraction before instalation ${chalk.bold(name)} in ` +
          ` ${chalk.bold(this.project.genericName)}/${config.folder.node_modules}`)

        this.project.run(`extract-zip ${p} ${nodeModulesPath}`).sync()
      }

    });
  }

}
//#endregion
