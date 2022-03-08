//#region @backend
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import { glob, crossPlatformPath } from 'tnp-core';
import chalk from 'chalk';
import { FeatureForProject, Project } from '../abstract';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';

export class QuickFixes extends FeatureForProject {

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

  public missingAngularLibFiles() {
    Helpers.log(`[quick fixes] missing angular lib fles start`)
    if (this.project.typeIs('angular-lib')) {
      const indexTs = path.join(this.project.location, config.folder.components, 'index.ts');
      if (!fse.existsSync(indexTs)) {
        Helpers.writeFile(indexTs, `
        export * from './public_api';
        `.trimLeft())

      }

      const pubilcApiLoc = path.join(this.project.location, config.folder.components, config.file.publicApi_ts);
      if (!fse.existsSync(pubilcApiLoc)) {
        Helpers.writeFile(pubilcApiLoc, `
        export function helloWorld() { }
        `.trimLeft())
      }
    }
    Helpers.log(`[quick fixes] missing angular lib fles end`)
  }

  badTypesInNodeModules() {

    if (this.project.frameworkVersionAtLeast('v2')) {
      [
        '@types/mocha',
        '@types/jasminewd2',
        '@types/jasmine',
        '@types/puppeteer-core',
        '@types/puppeteer',
        '@types/oauth2orize',
        '@types/lowdb',
        '@types/lowdb',
      ].forEach(name => {
        Helpers.removeFolderIfExists(path.join(this.project.node_modules.path, name));
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
    if (this.project.isTnp) { // TODO for all packages ???
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

  public linkSourceOfItselfToNodeModules() {
    return;
    // if (!this.project.isStandaloneProject) {
    //   return;
    // }
    // if (process.platform === 'win32') { // TODO QUICKFIX
    //   Helpers.warn(`[linkSourceOfItselfToNodeModules] [win32] functionality disabled`)
    //   return;
    // }
    // const pathToSelf = crossPlatformPath(path.join(this.project.location, config.folder.node_modules, this.project.name));
    // const pathToSrc = crossPlatformPath(path.join(this.project.location, this.project.typeIs('angular-lib') ? config.folder.components : config.folder.src));
    // Helpers.removeIfExists(pathToSelf);
    // glob.sync(`${pathToSrc}/**/*.*`)
    //   .filter(f => !Helpers.isFolder(f))
    //   .map(f => crossPlatformPath(f))
    //   .forEach(f => {
    //     const relative = f.replace(`${pathToSrc}/`, '');
    //     const from = f;
    //     const to1 = path.join(pathToSelf, relative);
    //     const to2 = path.join(pathToSelf, config.folder.browser, relative)
    //     try {
    //       Helpers.createSymLink(f, to1, { continueWhenExistedFolderDoesntExists: true });
    //       Helpers.createSymLink(f, to2, { continueWhenExistedFolderDoesntExists: true });
    //     } catch (error) {
    //       Helpers.warn(`[${config.frameworkName}][linkSourceOfItselfToNodeModules]
    //       Not able to link "${from}"
    //       to:
    //       ${to1}
    //       and
    //       ${to2}
    //       `)
    //     }

    //   });
  }

  public missingSourceFolders() { /// QUCIK_FIX make it more generic
    Helpers.log(`[quick fixes] missing source folder start`)
    if (!fse.existsSync(this.project.location)) {
      return;
    }
    if (this.project.isWorkspace ||
      this.project.isWorkspaceChildProject ||
      this.project.isStandaloneProject) {

      // if (this.project.isStandaloneProject && this.project.type === 'angular-lib') {
      //   Helpers.writeFile(path.join(this.project.location, config.file.tnpEnvironment_json), {});
      // }

      const srcFolder = path.join(this.project.location, config.folder.src);
      if (this.project.isWorkspace) {
        // Helpers.removeFolderIfExists(srcFolder);
      } else {
        if (!fse.existsSync(srcFolder)) {
          if (this.project.typeIs('angular-lib')) {
            const coreProj = Project.by('angular-lib', this.project._frameworkVersion) as Project;
            const coreSrcLocaion = path.join(coreProj.location, config.folder.src);
            Helpers.copy(coreSrcLocaion, srcFolder, { recursive: true, overwrite: true });
          } else {
            Helpers.mkdirp(srcFolder);
          }
        }
        // log('SRC folder recreated')
      }
      const componentsFolder = path.join(this.project.location, config.folder.components);

      if (this.project.typeIs(...(config.projectTypes.with.componetsAsSrc as ConfigModels.LibType[])) && !fse.existsSync(componentsFolder)) {
        // log('COMPONENTS folder recreated');
        Helpers.mkdirp(componentsFolder);
      }

      // TODO why would I do that ?
      // const browserStandaloneFolder = path.join(this.project.location, config.folder.browser);
      // if (this.project.type === 'angular-lib' && this.project.isStandaloneProject
      //   && !fse.existsSync(browserStandaloneFolder)) {
      //   // log('BROWSER folder recreated');
      //   fse.symlinkSync(this.project.location, browserStandaloneFolder);
      // }

      const customFolder = path.join(this.project.location, config.folder.custom);
      if (this.project.isSiteInStrictMode && !fse.existsSync(customFolder)) {
        // log('CUSTOM folder recreated');
        Helpers.mkdirp(customFolder);
      }
      if (this.project.isSiteInDependencyMode) {
        Helpers.removeFolderIfExists(customFolder);
      }

      const nodeModulesFolder = path.join(this.project.location, config.folder.node_modules);
      if (this.project.isWorkspace && !fse.existsSync(nodeModulesFolder)) {
        // log('NODE_MODULES folder recreated');
        Helpers.mkdirp(nodeModulesFolder)
      }
      if (this.project.isWorkspaceChildProject && !fse.existsSync(nodeModulesFolder)) {
        const paretnFolderOfNodeModules = path.join(this.project.parent.location, config.folder.node_modules);
        if (!fse.existsSync(paretnFolderOfNodeModules)) {
          // log('NODE_MODULES (parent) folder recreated');
          Helpers.mkdirp(paretnFolderOfNodeModules)
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
    Helpers.log(`[quick fixes] missing source folder end`)
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
