import {
  crossPlatformPath,
  //#region @backend
  path,
  //#endregion
  _
} from 'tnp-core';
import { ConfigModels } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../../abstract/project/project';
import { config } from 'tnp-config';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
import { BaseInsideStruct } from './base-inside-struct';
import { InsideStruct } from '../inside-struct';
import { recreateApp, recreateIndex } from './inside-struct-helpers';

@CLASS.NAME('InsideStructAngular13Lib')
export class InsideStructAngular13Lib extends BaseInsideStruct {

  private constructor(project: Project, websql: boolean) {
    super(project, websql);
    //#region @backend
    if (!project.frameworkVersionAtLeast('v3') || project.typeIsNot('isomorphic-lib')) {
      return
    }
    const tmpProjectsStandalone = `tmp-libs-for-{{{outFolder}}}${this.websql ? '-websql' : ''}/${project.name}`;
    const tmpProjects = `tmp-libs-for-{{{outFolder}}}${this.websql ? '-websql' : ''}/${project.name}--for--{{{client}}}`;
    const tmpSource = `tmp-src-{{{outFolder}}}${this.websql ? '-websql' : ''}`;
    const result = InsideStruct.from({
      //#region pathes from container codere isomrophic lib
      relateivePathesFromContainer: [
        //#region files to copy from core isomorphic lib
        'lib/src/app/app.component.html',
        'lib/src/app/app.component.scss',
        'lib/src/app/app.component.spec.ts',
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
        'lib/src/test.ts',
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
      projectType: project._type,
      frameworkVersion: project._frameworkVersion,
      pathReplacements: [
        [new RegExp('^lib\\/'), ({ client }) => {
          if (project.isStandaloneProject) {
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
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            config.file.package_json,
          );

          const container = Project.by('container', this.project._frameworkVersion) as Project;

          const json = Helpers.readJson(jsonPath) as Models.npm.IPackageJSON;

          json.devDependencies = {};

          Object.keys(container.packageJson.data.dependencies).forEach(pkgName => {
            json.dependencies[pkgName] = container.packageJson.data.dependencies[pkgName];
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
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/my-lib`
          );


          const dest = path.join(
            projectLocation,
            this.project.isStandaloneProject
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
            this.project.isStandaloneProject
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
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}/src/${config.file.public_api_ts}`,
          );

          let publicApiFile = Helpers.readFile(sourcePublicApi);


          const sourceTsconfig = path.join(
            projectLocation,
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `tsconfig.json`,
          );

          let tsconfigJson = Helpers.readJson(sourceTsconfig, void 0, true);

          if (tsconfigJson) {
            tsconfigJson.compilerOptions ? tsconfigJson.compilerOptions : {};
          }
          //#endregion

          if (this.project.isSmartContainerTarget) {
            //#region fixing tsconfig pathes
            const parent = this.project.smartContainerTargetParentContainer;
            const otherChildren = parent.children.filter(c => c.name !== this.project.name);
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
                this.project.isStandaloneProject
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


        [
          path.join(
            projectLocation,
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}/package.json`
          ),
          path.join(
            projectLocation,
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}/ng-package.json`
          ),
          path.join(
            projectLocation,
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `angular.json`
          ),
          path.join(
            projectLocation,
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `tsconfig.json`
          ),
        ].forEach(f => {
          let content = Helpers.readFile(f) || '';
          content = content.replace(new RegExp('my\\-lib', 'g'), projectName);
          if (path.basename(f) === 'tsconfig.json') {
            content = content.replace(
              new RegExp(Helpers.escapeStringForRegEx(`"${config.folder.bundle}/${projectName}`), 'g'),
              `"../../${outFolder}/${this.websql ? config.folder.websql : config.folder.browser}/${projectName}`);
          }

          Helpers.writeFile(f, content);
        });

        (() => {
          const ngPath = crossPlatformPath(path.join(
            projectLocation,
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}/ng-package.json`));

          // console.log({
          //   ngPath
          // })
          const json = Helpers.readJson(ngPath); // dist is on porpose
          json.dest = json.dest.replace(`/dist/${projectName}`, `/../../${outFolder}/`
            + `${this.websql ? config.folder.websql : config.folder.browser}`);

          Helpers.writeJson(ngPath, json);
        })();

        recreateApp(project);
        recreateIndex(project);


      })
    });
    // @ts-ignore
    this.struct = result;
    //#endregion
  }

}


//#endregion
