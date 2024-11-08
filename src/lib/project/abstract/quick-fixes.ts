//#region imports
//#region @backend
import { glob, fse, chalk } from 'tnp-core/src';
//#endregion
import { path, _, crossPlatformPath } from 'tnp-core/src';
import { Project } from '../abstract/project';
import {
  UtilsTypescript,
} from 'tnp-helpers/src';
import { Helpers, BaseQuickFixes } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import { folder_shared_folder_info, tempSourceFolder } from '../../constants';
import { Models } from '../../models';
//#endregion

export class QuickFixes extends BaseQuickFixes<Project> {
  project: Project;
  //#region update stanalone project before publishing
  updateStanaloneProjectBeforePublishing(
    project: Project,
    realCurrentProj: Project,
    specyficProjectForBuild: Project,
  ) {
    //#region @backendFunc
    if (project.__isStandaloneProject) {
      const distForPublishPath = crossPlatformPath([
        specyficProjectForBuild.location,
        project.__getTempProjName('dist'),
        config.folder.node_modules,
        project.name,
      ]);

      Helpers.remove(`${distForPublishPath}/app*`); // QUICK_FIX
      Helpers.remove(`${distForPublishPath}/tests*`); // QUICK_FIX
      Helpers.remove(`${distForPublishPath}/src`, true); // QUICK_FIX
      Helpers.writeFile(
        crossPlatformPath([distForPublishPath, 'src.d.ts']),
        `
// THIS FILE IS GENERATED
export * from './lib';
// THIS FILE IS GENERATED
// please use command: taon build:watch to see here links for your globally builded lib code files
// THIS FILE IS GENERATED
      `.trimStart(),
      );

      const pjPath = crossPlatformPath([
        distForPublishPath,
        config.file.package_json,
      ]);

      const pj = Helpers.readJson(pjPath) as Models.IPackageJSON;
      if (realCurrentProj.name === 'tnp') {
        pj.devDependencies = {};
        pj.dependencies = {}; // tnp is not going to be use in any other project
      } else {
        pj.devDependencies = {};
      }
      Helpers.removeFileIfExists(pjPath);
      Helpers.writeJson(pjPath, pj); // QUICK_FIX
    }
    //#endregion
  }
  //#endregion

  //#region update container project before publishing
  updateContainerProjectBeforePublishing(
    project: Project,
    realCurrentProj: Project,
    specyficProjectForBuild: Project,
  ) {
    //#region @backendFunc
    if (project.__isSmartContainer) {
      const base = path.join(
        specyficProjectForBuild.location,
        specyficProjectForBuild.__getTempProjName('dist'),
        config.folder.node_modules,
        `@${realCurrentProj.name}`,
      );

      for (const child of realCurrentProj.children) {
        const distReleaseForPublishPath = crossPlatformPath([base, child.name]);
        // console.log({
        //   distReleaseForPublishPath
        // })
        Helpers.remove(`${distReleaseForPublishPath}/src`, true); // QUICK_FIX
        Helpers.writeFile(
          crossPlatformPath([distReleaseForPublishPath, 'src.d.ts']),
          `
  // THIS FILE IS GENERATED
  export * from './index';
  // THIS FILE IS GENERATED
  // please use command: taon build:watch to see here links for your globally builded lib code files
  // THIS FILE IS GENERATED
        `.trimStart(),
        );
      }
    }
    //#endregion
  }
  //#endregion

  //#region recreate temp source necessary files
  recreateTempSourceNecessaryFiles(outDir: 'dist') {
    //#region @backendFunc
    if (this.project.typeIsNot('isomorphic-lib')) {
      return;
    }

    (() => {
      const tsconfigBrowserPath = path.join(
        this.project.location,
        'tsconfig.browser.json',
      );
      const tempDirs = [
        tempSourceFolder(outDir, true, true),
        tempSourceFolder(outDir, false, false),
        tempSourceFolder(outDir, true, false),
        tempSourceFolder(outDir, false, true),
      ];
      tempDirs.forEach(dirName => {
        // console.log(`

        //   REBUILDING: ${dirName}

        //   `)
        const dest = path.join(this.project.location, dirName, 'tsconfig.json');
        Helpers.copyFile(tsconfigBrowserPath, dest);

        Helpers.writeJson(
          crossPlatformPath([
            this.project.location,
            dirName,
            'tsconfig.spec.json',
          ]),
          {
            extends: './tsconfig.json',
            compilerOptions: {
              outDir: './out-tsc/spec',
              types: ['jest', 'node'],
            },
            files: ['src/polyfills.ts'],
            include: [
              'lib/**/*.spec.ts',
              'lib/**/*.d.ts',
              'app/**/*.spec.ts',
              'app/**/*.d.ts',
            ],
          },
        );

        Helpers.writeFile(
          crossPlatformPath([this.project.location, dirName, 'jest.config.js']),
          `
module.exports = {
preset: "jest-preset-angular",
setupFilesAfterEnv: ["<rootDir>/setupJest.ts"],
reporters: ["default", "jest-junit"],
};`.trim() + '\n',
        );

        Helpers.writeFile(
          crossPlatformPath([this.project.location, dirName, 'setupJest.ts']),
          `
import 'jest-preset-angular/setup-jest';
import './jestGlobalMocks';
`.trim() + '\n',
        );

        Helpers.writeFile(
          crossPlatformPath([
            this.project.location,
            dirName,
            'jestGlobalMocks.ts',
          ]),
          `
Object.defineProperty(window, 'CSS', {value: null});
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance']
    };
  }
});
/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});
`.trim() + '\n',
        );
      });
    })();

    // const componentsFolder = path.join(this.project.location, config.folder.components)
    // if (fse.existsSync(componentsFolder)) {
    //   // TODO join isomorphic part with tsconfig.isomorphic.json
    //   Helpers.writeFile(path.join(componentsFolder, config.file.tsconfig_json), {
    //     "compileOnSave": true,
    //     "compilerOptions": {
    //       "declaration": true,
    //       "experimentalDecorators": true,
    //       "emitDecoratorMetadata": true,
    //       "allowSyntheticDefaultImports": true,
    //       'importHelpers': true,
    //       "moduleResolution": "node",
    //       "module": "commonjs",
    //       "skipLibCheck": true,
    //       "sourceMap": true,
    //       "target": "es5",
    //       "lib": [
    //         "es2015",
    //         "es2015.promise",
    //         "es2015.generator",
    //         "es2015.collection",
    //         "es2015.core",
    //         "es2015.reflect",
    //         "es2016",
    //         "dom"
    //       ],
    //       "types": [
    //         "node"
    //       ],
    //     },
    //     "include": [
    //       "./**/*"
    //     ],
    //     "exclude": [
    //       "node_modules",
    //       "preview",
    //       "projects",
    //       "docs",
    //       "dist",
    //       "example",
    //       "examples",
    //       "browser",
    //       "module",
    //       "tmp-src",
    //       "src/tests",
    //       "src/**/*.spec.ts",
    //       "tmp-site-src",
    //       "tmp-tests-context"
    //     ]
    //   })
    // }
    // }
    //#endregion
  }
  //#endregion

  //#region remove uncessesary files
  removeUncessesaryFiles() {
    const filesV1 = [
      'src/tsconfig.packages.json',
      'src/tsconfig.spec.json',
      'src/tsconfig.app.json',
      '.angular-cli.json',
    ];
  }
  //#endregion

  //#region  remove tnp from itself
  /**
   * TODO QUICK FIX
   * something wrong when minifying cli
   */
  public async removeTnpFromItself(actionwhenNotInNodeModules: () => {}) {
    //#region @backendFunc
    if (!(this.project.name === 'tnp' && this.project.isInCiReleaseProject)) {
      await Helpers.runSyncOrAsync({
        functionFn: actionwhenNotInNodeModules,
      });
    }
    const nodeMOdules = crossPlatformPath(
      path.join(this.project.location, config.folder.node_modules),
    );
    if (Helpers.exists(nodeMOdules)) {
      const folderToMove = crossPlatformPath([
        crossPlatformPath(fse.realpathSync(nodeMOdules)),
        'tnp',
      ]);

      const folderTemp = crossPlatformPath([
        crossPlatformPath(fse.realpathSync(nodeMOdules)),
        'temp-location-tnp',
      ]);

      Helpers.move(folderToMove, folderTemp);
      await Helpers.runSyncOrAsync({
        functionFn: actionwhenNotInNodeModules,
      });
      Helpers.move(folderTemp, folderToMove);
    }
    //#endregion
  }
  //#endregion

  //#region add missing anular files
  public missingAngularLibFiles() {
    //#region @backendFunc
    Helpers.taskStarted(`[quick fixes] missing angular lib fles start`, true);
    if (
      this.project.__frameworkVersionAtLeast('v3') &&
      this.project.typeIs('isomorphic-lib')
    ) {
      (() => {
        if (
          (this.project.__isStandaloneProject &&
            !this.project.__isSmartContainerTarget) ||
          this.project.__isSmartContainerChild
        ) {
          const indexTs = crossPlatformPath(
            path.join(this.project.location, config.folder.src, 'lib/index.ts'),
          );
          if (!Helpers.exists(indexTs)) {
            Helpers.writeFile(
              indexTs,
              `
            export function helloWorldFrom${_.upperFirst(_.camelCase(this.project.name))}() { }
            `.trimLeft(),
            );
          }
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

        Helpers.writeFile(
          shared_folder_info,
          `
THIS FILE IS GENERATED. THIS FILE IS GENERATED. THIS FILE IS GENERATED.

Assets from this folder are being shipped with this npm package (${this.project.__npmPackageNameAndVersion})
created from this project.

THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.
          `.trimLeft(),
        );
      })();

      (() => {
        const shared_folder_info = crossPlatformPath([
          this.project.location,
          config.folder.src,
          config.folder.migrations,
          'migrations-info.md',
        ]);

        Helpers.writeFile(
          shared_folder_info,
          `
THIS FILE IS GENERATED. THIS FILE IS GENERATED. THIS FILE IS GENERATED.

This folder is only for storing migration files with auto-generated names.

THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.
          `.trimLeft(),
        );
      })();

      (() => {
        const shared_folder_info = crossPlatformPath([
          this.project.location,
          config.folder.src,
          config.folder.lib,
          'lib-info.md',
        ]);

        Helpers.writeFile(
          shared_folder_info,
          `
THIS FILE IS GENERATED. THIS FILE IS GENERATED. THIS FILE IS GENERATED.

This folder is an entry point for npm Angular/NodeJS library

THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.
          `.trimLeft(),
        );
      })();

      (() => {
        const shared_folder_info = crossPlatformPath([
          this.project.location,
          config.folder.src,
          'tests',
          'mocha-tests-info.md',
        ]);

        Helpers.writeFile(
          shared_folder_info,
          `
THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.

# Purpose of this folder
Put your backend **mocha** tests (with *.test.ts extension) in this folder or any other *tests*
folder inside project.

\`\`\`
/src/lib/my-feature/features.test.ts                          # -> NOT ok, test omitted
/src/lib/my-feature/tests/features.test.ts                    # -> OK
/src/lib/my-feature/nested-feature/tests/features.test.ts     # -> OK
\`\`\`


# How to test your isomorphic backend ?

1. By using console select menu:
\`\`\`
taon test                   # single run
taon test:watch             # watch mode
taon test:debug             # and start "attach" VSCode debugger
taon test:watch:debug       # and start "attach" VSCode debugger
\`\`\`

2. Directly:
\`\`\`
taon mocha                        # single run
taon mocha:watch                  # watch mode
taon mocha:debug                  # and start "attach" VSCode debugger
taon mocha:watch:debug            # and start "attach" VSCode debugger
\`\`\`

# Example
example.test.ts
\`\`\`ts
import { describe, before, it } from 'mocha'
import { expect } from 'chai';

describe('Set name for function or class', () => {

  it('should keep normal function name ', () => {
    expect(1).to.be.eq(Number(1));
  })
});
\`\`\`

THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.

          `.trimLeft(),
        );
      })();
    }

    Helpers.taskDone(`[quick fixes] missing angular lib fles end`);
    //#endregion
  }
  //#endregion

  //#region bad types in node modules
  removeBadTypesInNodeModules() {
    //#region @backendFunc
    if (
      this.project.__frameworkVersionAtLeast('v2') &&
      (this.project.__isStandaloneProject || this.project.__isSmartContainer)
    ) {
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
        '@types/inquirer',
      ].forEach(name => {
        Helpers.remove(path.join(this.project.__node_modules.path, name));
      });
      const globalsDts = this.project.readFile(
        'node_modules/@types/node/globals.d.ts',
      );
      try {
        this.project.writeFile(
          'node_modules/@types/node/globals.d.ts',
          UtilsTypescript.removeRegionByName(globalsDts, 'borrowed'),
        );
      } catch (error) {
        Helpers.error(
          `Problem with removing borrowed types from globals.d.ts`,
          true,
          false,
        );
        this.project.writeFile(
          'node_modules/@types/node/globals.d.ts',
          globalsDts,
        );
      }
    }
    // if (this.project.isVscodeExtension) {
    //   [

    //   ].forEach(name => {
    //     Helpers.removeFolderIfExists(path.join(this.project.node_modules.path, name));
    //   });
    // }
    //#endregion
  }
  //#endregion

  //#region add missing empty libs
  /**
   * @deprecated
   */
  public missingEmptyDummyLibs(missingLibsNames: string[] = []) {
    //#region @backendFunc
    if (this.project.__isContainer) {
      return;
    }
    missingLibsNames.forEach(missingLibName => {
      const pathInProjectNodeModules = path.join(
        this.project.location,
        config.folder.node_modules,
        missingLibName,
      );
      if (fse.existsSync(pathInProjectNodeModules)) {
        if (this.project.__isStandaloneProject) {
          Helpers.warn(
            `Package "${missingLibName}" will replaced with empty package mock. ${this.project.genericName}`,
          );
        }
      }
      // Helpers.remove(pathInProjectNodeModules);
      if (!fse.existsSync(pathInProjectNodeModules)) {
        Helpers.mkdirp(pathInProjectNodeModules);
      }

      Helpers.writeFile(
        path.join(pathInProjectNodeModules, 'index.js'),
        `
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = {};
`,
      );
      Helpers.writeFile(
        path.join(pathInProjectNodeModules, 'index.d.ts'),
        `
declare const _default: {};
export default _default;
`,
      );
      Helpers.writeFile(
        path.join(pathInProjectNodeModules, config.file.package_json),
        {
          name: missingLibName,
          version: '0.0.0',
        } as Models.IPackageJSON,
      );
    });
    //#endregion
  }
  //#endregion

  //#region add missing source folder
  public addMissingSrcFolderToEachProject() {
    //#region @backendFunc
    /// QUCIK_FIX make it more generic
    if (this.project.__frameworkVersionEquals('v1')) {
      return;
    }
    Helpers.taskStarted(`[quick fixes] missing source folder start`, true);
    if (!fse.existsSync(this.project.location)) {
      return;
    }
    if (
      this.project.__isStandaloneProject &&
      !this.project.__isSmartContainerTarget
    ) {
      const srcFolder = path.join(this.project.location, config.folder.src);

      if (!fse.existsSync(srcFolder)) {
        Helpers.mkdirp(srcFolder);
      }
    }
    Helpers.taskDone(`[quick fixes] missing source folder end`);
    //#endregion
  }
  //#endregion

  //#region node_modules replacements zips
  public get nodeModulesPkgsReplacements() {
    //#region @backendFunc
    const npmReplacements = glob
      .sync(`${this.project.location} /${config.folder.node_modules}-*.zip`)
      .map(p => p.replace(this.project.location, '').slice(1));

    return npmReplacements;
    //#endregion
  }

  /**
   * FIX for missing npm packages from npmjs.com
   *
   * Extract each file: node_modules-<package Name>.zip
   * to node_modules folder before instalation.
   * This will prevent packages deletion from npm
   */
  public unpackNodeModulesPackagesZipReplacements() {
    //#region @backendFunc
    const nodeModulesPath = path.join(
      this.project.location,
      config.folder.node_modules,
    );

    if (!fse.existsSync(nodeModulesPath)) {
      Helpers.mkdirp(nodeModulesPath);
    }
    this.nodeModulesPkgsReplacements.forEach(p => {
      const name = p.replace(`${config.folder.node_modules}-`, '');
      const moduleInNodeMdules = path.join(
        this.project.location,
        config.folder.node_modules,
        name,
      );
      if (fse.existsSync(moduleInNodeMdules)) {
        Helpers.info(
          `Extraction ${chalk.bold(name)} already exists in ` +
            ` ${chalk.bold(this.project.genericName)}/${config.folder.node_modules}`,
        );
      } else {
        Helpers.info(
          `Extraction before instalation ${chalk.bold(name)} in ` +
            ` ${chalk.bold(this.project.genericName)}/${config.folder.node_modules}`,
        );

        this.project.run(`extract-zip ${p} ${nodeModulesPath}`).sync();
      }
    });
    //#endregion
  }
  //#endregion
}
