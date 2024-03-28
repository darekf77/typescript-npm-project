//#region imports
import { crossPlatformPath, path, _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../../abstract/project';
import { Models } from '../../../../models';
import { config } from 'tnp-config/src';
import { BaseInsideStruct } from './base-inside-struct';
import { InsideStruct } from '../inside-struct';
import { recreateApp, recreateIndex } from './inside-struct-helpers';
//#endregion

export class InsideStructAngular13Lib extends BaseInsideStruct {

  constructor(project: Project, websql: boolean) {
    super(project, websql);
    //#region @backend
    if (!project.__frameworkVersionAtLeast('v3') || project.typeIsNot('isomorphic-lib')) {
      return
    }
    const tmpProjectsStandalone = `tmp-libs-for-{{{outFolder}}}${this.websql ? '-websql' : ''}/${project.name}`;
    const tmpProjects = `tmp-libs-for-{{{outFolder}}}${this.websql ? '-websql' : ''}/${project.name}--for--{{{client}}}`;
    // const tmpSource = `tmp-src-{{{outFolder}}}${this.websql ? '-websql' : ''}`;
    const result = InsideStruct.from({
      //#region pathes from container codere isomrophic lib
      relateivePathesFromContainer: [
        //#region files to copy from core isomorphic lib
        'lib/src/app/app.component.html',
        'lib/src/app/app.component.scss',
        // 'lib/src/app/app.component.spec.ts', // not working -> something better needed
        'lib/src/app/app.component.ts',
        'lib/src/app/app.module.ts',
        'lib/src/environments/environment.prod.ts',
        'lib/src/environments/environment.ts',
        'lib/src/app',
        'lib/src/environments',
        'lib/src/favicon.ico',
        'lib/src/index.html',
        'lib/src/main.ts',
        'lib/src/polyfills.ts',
        'lib/src/styles.scss',
        // 'lib/src/test.ts', // node needed for jest test - (but the don' work wit symlinks)
        'lib/.browserslistrc',
        'lib/.editorconfig',
        'lib/.gitignore',
        // 'app/README.md',
        'lib/angular.json',
        'lib/karma.conf.js',
        'lib/package-lock.json',
        'lib/package.json',
        'lib/tsconfig.app.json',
        'lib/tsconfig.json',
        'lib/tsconfig.spec.json',
        'lib/projects/my-lib/src',
        'lib/projects/my-lib/tsconfig.spec.json',
        'lib/projects/my-lib/tsconfig.lib.prod.json',
        'lib/projects/my-lib/tsconfig.lib.json',
        'lib/projects/my-lib/README.md',
        'lib/projects/my-lib/package.json',
        'lib/projects/my-lib/ng-package.json',
        'lib/projects/my-lib/karma.conf.js',
        //#endregion
      ],
      //#endregion
      projectType: project.type,
      frameworkVersion: project.__frameworkVersion,
      pathReplacements: [
        [new RegExp('^lib\\/'), ({ client }) => {
          if (project.__isStandaloneProject) {
            return `${tmpProjectsStandalone}/`;
          }
          return `${tmpProjects}/`;
        }],
      ],
      linkNodeModulesTo: ['lib/'],
      endAction: (({ outFolder, projectName, client, replacement, projectLocation }) => {

        //#region fixing package json dependencies in target proj
        (() => {
          const jsonPath = path.join(
            projectLocation,
            this.project.__isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            config.file.package_json,
          );

          const container = Project.by('container', this.project.__frameworkVersion) as Project;

          const json = Helpers.readJson(jsonPath) as Models.IPackageJSON;

          json.devDependencies = {};

          Object.keys(container.__packageJson.data.dependencies).forEach(pkgName => {
            json.dependencies[pkgName] = container.__packageJson.data.dependencies[pkgName];
          });

          // Object.keys(json.devDependencies).forEach(pkgName => {
          //   json.devDependencies[pkgName] = container.packageJson.data.dependencies[pkgName];
          // });

          Helpers.writeJson(jsonPath, json);

        })();
        //#endregion

        //#region replace my-lib from container in targe proj
        (() => {
          const source = path.join(
            projectLocation,
            this.project.__isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/my-lib`
          );


          const dest = path.join(
            projectLocation,
            this.project.__isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}`
          );
          Helpers.remove(dest);
          Helpers.move(source, dest);
        })();
        //#endregion

        (() => {
          //#region hande / src / lib
          const source = path.join(
            projectLocation,
            `tmp-src-${outFolder}${this.websql ? '-websql' : ''}`,
            'lib'
          );

          const dest = path.join(
            projectLocation,
            this.project.__isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}/src/lib`
          );
          Helpers.remove(dest);
          Helpers.createSymLink(source, dest,
            { continueWhenExistedFolderDoesntExists: true });
          //#endregion

          //#region resolve varaibles
          const sourcePublicApi = path.join(
            projectLocation,
            this.project.__isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}/src/${config.file.public_api_ts}`,
          );

          let publicApiFile = Helpers.readFile(sourcePublicApi);


          const sourceTsconfig = path.join(
            projectLocation,
            this.project.__isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `tsconfig.json`,
          );

          let tsconfigJson = Helpers.readJson(sourceTsconfig, void 0, true);

          if (tsconfigJson) {
            tsconfigJson.compilerOptions ? tsconfigJson.compilerOptions : {};
          }
          //#endregion

          if (this.project.__isSmartContainerTarget) {
            //#region fixing tsconfig pathes
            const parent = this.project.__smartContainerTargetParentContainer;
            const otherChildren = parent.children.filter(c => c.name !== this.project.name);
            // console.log({
            //   otherChildren: otherChildren.map(c => c.location)
            // })
            const base = this.project.name;
            if (tsconfigJson) {
              tsconfigJson.compilerOptions.paths = otherChildren.reduce((a, b) => {
                return _.merge(a, {
                  [`@${parent.name}/${b.name}/${this.websql ? config.folder.websql : config.folder.browser}`]: [
                    `./projects/${base}/src/libs/${b.name}`
                  ],
                  [`@${parent.name}/${b.name}/${this.websql ? config.folder.websql : config.folder.browser}/*`]: [
                    `./projects/${base}/src/libs/${b.name}/*`
                  ],
                })
              }, {});

              tsconfigJson.compilerOptions.paths[`@${parent.name}/${this.project.name}/${this.websql ? config.folder.websql : config.folder.browser}`] = [
                `./projects/${base}/src/lib`
              ];
              tsconfigJson.compilerOptions.paths[`@${parent.name}/${this.project.name}/${this.websql ? config.folder.websql : config.folder.browser}/*`] = [
                `./projects/${base}/src/lib/*`
              ];
            }
            //#endregion

            if (otherChildren.length > 0) {
              publicApiFile = `
export * from './lib';
${otherChildren.map(c => {
                return `export * from './libs/${c.name}';`
              }).join('\n')}
`.trimLeft();
            } else {
              publicApiFile = `
export * from './lib';
`.trimLeft();
            }

            (() => {
              const assetDummySourceForLib = path.join(
                projectLocation,
                `tmp-src-${outFolder}${this.websql ? '-websql' : ''}`,
                config.folder.assets,
              );

              const assetDummyDestForLib = path.join(
                projectLocation,
                this.project.__isStandaloneProject
                  ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
                `projects/${projectName}/src/${config.folder.assets}`
              );

              Helpers.remove(assetDummyDestForLib);
              Helpers.createSymLink(assetDummySourceForLib, assetDummyDestForLib, { continueWhenExistedFolderDoesntExists: true });
            })();

            for (let index = 0; index < otherChildren.length; index++) {
              const child = otherChildren[index];

              //#region replace browser cut code in destination lib
              const sourceChild = path.join(
                projectLocation,
                `tmp-src-${outFolder}${this.websql ? '-websql' : ''}`,
                'libs',
                child.name,
              );

              const destChild = path.join(
                projectLocation,
                this.project.__isStandaloneProject
                  ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
                `projects/${projectName}/src/libs/${child.name}`
              );

              Helpers.remove(destChild);
              Helpers.createSymLink(sourceChild, destChild, { continueWhenExistedFolderDoesntExists: true });
              //#endregion

            }
          } else {
            if (tsconfigJson) {
              tsconfigJson.compilerOptions.paths = void 0;

            }
            publicApiFile = `
export * from './lib';
`.trimLeft();
          }

          if (tsconfigJson) {
            Helpers.writeJson(sourceTsconfig, tsconfigJson);
          }

          Helpers.writeFile(sourcePublicApi, publicApiFile);

        })();

        const libPackageJson = crossPlatformPath([
          projectLocation,
          this.project.__isStandaloneProject
            ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
          `projects/${projectName}/package.json`
        ]);

        const ngPackageJson = crossPlatformPath([
          projectLocation,
          this.project.__isStandaloneProject
            ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
          `projects/${projectName}/ng-package.json`
        ]);

        const angularJson = crossPlatformPath([
          projectLocation,
          this.project.__isStandaloneProject
            ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
          `angular.json`
        ]);

        const tsconfigJson = crossPlatformPath([
          projectLocation,
          this.project.__isStandaloneProject
            ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
          `tsconfig.json`
        ]);

        [
          libPackageJson,
          ngPackageJson,
          angularJson,
          tsconfigJson,
        ].forEach(f => {
          let content = Helpers.readFile(f) || '';
          content = content.replace(new RegExp('my\\-lib', 'g'), projectName);
          if (path.basename(f) === 'tsconfig.json') {
            content = content.replace(
              new RegExp(Helpers.escapeStringForRegEx(`"${config.folder.dist}/${projectName}`), 'g'),
              `"../../${outFolder}/${this.websql ? config.folder.websql : config.folder.browser}/${projectName}`);
          }

          Helpers.writeFile(f, content);
        });

        (() => {
          const json = Helpers.readJson(ngPackageJson); // dist is on porpose
          json.dest = json.dest.replace(`/dist/${projectName}`, `/../../${outFolder}/`
            + `${this.websql ? config.folder.websql : config.folder.browser}`);

          Helpers.writeJson(ngPackageJson, json);
        })();

        // (() => {
        //   let json = Helpers.readFile(libPackageJson); // dist is on porpose
        //   json = json.replace(`"${projectName}"`, `"${projectName}/`
        //     + `${this.websql ? config.folder.websql : config.folder.browser}"`);

        //   Helpers.writeJson(libPackageJson, JSON.parse(json));
        // })();

        recreateApp(project);
        recreateIndex(project);


      })
    });
    this.struct = result as any;
    //#endregion
  }

}


//#endregion
