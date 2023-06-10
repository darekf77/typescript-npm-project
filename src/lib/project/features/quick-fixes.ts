//#region @backend
import { path, _ } from 'tnp-core'
import { fse, rimraf } from 'tnp-core'
import { glob, crossPlatformPath } from 'tnp-core';
import chalk from 'chalk';
import { FeatureForProject, Project } from '../abstract';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
import { folder_shared_folder_info } from '../../constants';

export class QuickFixes extends FeatureForProject {

  updateStanaloneProjectBeforePublishing(project: Project, realCurrentProj: Project, specyficProjectForBuild: Project) {
    if (project.isStandaloneProject) {
      const bundleForPublishPath = crossPlatformPath([
        specyficProjectForBuild.location,
        project.getTempProjName('bundle'),
        config.folder.node_modules,
        project.name
      ]);

      Helpers.remove(`${bundleForPublishPath}/app*`); // QUICK_FIX
      Helpers.remove(`${bundleForPublishPath}/tests*`); // QUICK_FIX
      const pjPath = crossPlatformPath([
        bundleForPublishPath,
        config.file.package_json,
      ]);

      const pj = Helpers.readJson(pjPath) as Models.npm.IPackageJSON;
      if (realCurrentProj.name === 'tnp') {
        pj.devDependencies = {};
        pj.dependencies = {}; // tnp is not going to be use in any other project
      } else {
        pj.devDependencies = {};
      }
      Helpers.removeFileIfExists(pjPath);
      Helpers.writeJson(pjPath, pj)// QUICK_FIX
    }
  }

  updateTsconfigsInTmpSrcBrowserFolders() {
    if (this.project.typeIs('angular-lib', 'isomorphic-lib')) {
      const tsconfigBrowserPath = path.join(this.project.location, 'tsconfig.browser.json');
      const tempDirs = fse.readdirSync(this.project.location).filter(dir => dir.startsWith('tmp-src-'));
      tempDirs.forEach(dirName => {
        const dest = path.join(this.project.location, dirName, 'tsconfig.json');
        Helpers.copyFile(tsconfigBrowserPath, dest);
      })

      const componentsFolder = path.join(this.project.location, config.folder.components)
      if (fse.existsSync(componentsFolder)) {
        // TODO join isomorphic part with tsconfig.isomorphic.json
        Helpers.writeFile(path.join(componentsFolder, config.file.tsconfig_json), {
          "compileOnSave": true,
          "compilerOptions": {
            "declaration": true,
            "experimentalDecorators": true,
            "emitDecoratorMetadata": true,
            "allowSyntheticDefaultImports": true,
            'importHelpers': true,
            "moduleResolution": "node",
            "module": "commonjs",
            "skipLibCheck": true,
            "sourceMap": true,
            "target": "es5",
            "lib": [
              "es2015",
              "es2015.promise",
              "es2015.generator",
              "es2015.collection",
              "es2015.core",
              "es2015.reflect",
              "es2016",
              "dom"
            ],
            "types": [
              "node"
            ],
          },
          "include": [
            "./**/*"
          ],
          "exclude": [
            "node_modules",
            "preview",
            "projects",
            "docs",
            "dist",
            "bundle",
            "example",
            "examples",
            "browser",
            "module",
            "tmp-src",
            "src/tests",
            "src/**/*.spec.ts",
            "tmp-site-src",
            "tmp-tests-context"
          ]
        })
      }
    }
  }


  removeUncessesaryFiles() {
    const filesV1 = [
      'src/tsconfig.packages.json',
      'src/tsconfig.spec.json',
      'src/tsconfig.app.json',
      '.angular-cli.json'
    ]

    if (this.project.frameworkVersionAtLeast('v2') && this.project.typeIs('angular-lib')) {
      for (let index = 0; index < filesV1.length; index++) {
        const oldFile = path.join(this.project.location, filesV1[index]);
        Helpers.removeFileIfExists(oldFile)
      }
    }
  }

  public removeTnpFromItself() {
    //#region @backend
    const nodeMOdules = crossPlatformPath(path.join(this.project.location, config.folder.node_modules));
    if (Helpers.exists(nodeMOdules)) {
      const folderToDelete = crossPlatformPath([
        crossPlatformPath(fse.realpathSync(nodeMOdules)),
        'tnp',
      ]);
      // TODO only tnp can release tnp (for @vercel/ncc builder)
      if ((config.frameworkName === 'tnp') && (this.project.name === 'tnp') && this.project.isInRelaseBundle) {
        Helpers.remove(folderToDelete);
      }
    }
    //#endregion
  }

  public missingAngularLibFiles() {
    Helpers.taskStarted(`[quick fixes] missing angular lib fles start`, true);
    if (this.project.frameworkVersionAtLeast('v3') && this.project.typeIs('isomorphic-lib')) {

      (() => {
        const indexTs = crossPlatformPath(path.join(this.project.location, config.folder.src, 'lib/index.ts'));
        if (!Helpers.exists(indexTs)) {
          Helpers.writeFile(indexTs, `
          export function helloWorldFrom${_.upperFirst(_.camelCase(this.project.name))}() { }
          `.trimLeft())
        }
      })();

      (() => {
        const shared_folder_info = crossPlatformPath([
          this.project.location,
          config.folder.src,
          config.folder.assets,
          config.folder.shared,
          folder_shared_folder_info,
        ]);

        Helpers.writeFile(shared_folder_info, `
THIS FILE IS GENERATED. THIS FILE IS GENERATED. THIS FILE IS GENERATED.

Assets from this folder are being shipped with this npm package (${this.project.npmPackageNameAndVersion})
created from this project.

THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.
          `.trimLeft())

      })();


    }

    Helpers.taskDone(`[quick fixes] missing angular lib fles end`)
  }

  badTypesInNodeModules() {

    if (this.project.frameworkVersionAtLeast('v2')) {
      [
        '@types/prosemirror-*',
        '@types/mocha',
        '@types/jasmine*',
        '@types/puppeteer-core',
        '@types/puppeteer',
        '@types/oauth2orize',
        '@types/lowdb',
        '@types/eslint',
        '@types/eslint-scope',
      ].forEach(name => {
        Helpers.remove(path.join(this.project.node_modules.path, name));
      });
    }
    // if (this.project.isVscodeExtension) {
    //   [


    //   ].forEach(name => {
    //     Helpers.removeFolderIfExists(path.join(this.project.node_modules.path, name));
    //   });
    // }
  }

  public overritenBadNpmPackages() {
    Helpers.log(`Fixing bad npm packages - START for ${this.project.genericName}`);
    if (this.project.isTnp || this.project.isContainerCoreProject) { // TODO for all packages ???
      this.project.node_modules.fixesForNodeModulesPackages
        .forEach(f => {
          const source = path.join(this.project.location, f);
          const dest = path.join(this.project.location, config.folder.node_modules, f);
          Helpers.tryCopyFrom(source, dest);
        });
    }

    if (this.project.isWorkspace) {
      if (this.project.isGenerated) {
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
      if (this.project.isSite) {
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
    }

    Helpers.log(`Fixing bad npm packages - COMPLETE`);
  }

  public missingLibs(missingLibsNames: string[] = []) {
    if (this.project.isContainer) {
      return;
    }
    missingLibsNames.forEach(missingLibName => {
      const pathInProjectNodeModules = path.join(this.project.location, config.folder.node_modules, missingLibName)
      if (fse.existsSync(pathInProjectNodeModules)) {
        if (this.project.isStandaloneProject || this.project.isWorkspace) {
          Helpers.warn(`Package "${missingLibName}" will replaced with empty package mock. ${this.project.genericName}`)
        }
      }
      // Helpers.remove(pathInProjectNodeModules);
      if (!fse.existsSync(pathInProjectNodeModules)) {
        Helpers.mkdirp(pathInProjectNodeModules);
      }

      Helpers.writeFile(path.join(pathInProjectNodeModules, 'index.js'), `
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = {};
`);
      Helpers.writeFile(path.join(pathInProjectNodeModules, 'index.d.ts'), `
declare const _default: {};
export default _default;
`);
      Helpers.writeFile(path.join(pathInProjectNodeModules, config.file.package_json), {
        name: missingLibName,
        version: "0.0.0"
      } as Models.npm.IPackageJSON);

    })
  }


  public missingSourceFolders() { /// QUCIK_FIX make it more generic
    if (this.project.frameworkVersionEquals('v1')) {
      return;
    }
    Helpers.taskStarted(`[quick fixes] missing source folder start`, true)
    if (!fse.existsSync(this.project.location)) {
      return;
    }
    if (this.project.isStandaloneProject && !this.project.isSmartContainerTarget) {
      const srcFolder = path.join(this.project.location, config.folder.src);

      if (!fse.existsSync(srcFolder)) {
        Helpers.mkdirp(srcFolder);
      }
    }
    Helpers.taskDone(`[quick fixes] missing source folder end`)
  }

  public get nodeModulesReplacementsZips() {
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
      Helpers.mkdirp(nodeModulesPath)
    }
    this.nodeModulesReplacementsZips.forEach(p => {
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
