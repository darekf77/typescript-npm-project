import {
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

@CLASS.NAME('InsideStructAngular13Lib')
export class InsideStructAngular13Lib extends BaseInsideStruct {

  private constructor(project: Project) {
    super(project);
    //#region @backend
    if (!project.frameworkVersionAtLeast('v3')) {
      return
    }
    const tmpProjectsStandalone = `tmp-libs-for-{{{outFolder}}}/${project.name}`;
    const tmpProjects = `tmp-libs-for-{{{outFolder}}}/${project.name}--for--{{{client}}}`;
    const result = InsideStruct.from({

      relateivePathesFromContainer: [
        //#region releative pathes from core project
        'lib/src/app/app.component.html',
        'lib/src/app/app.component.scss',
        'lib/src/app/app.component.spec.ts',
        'lib/src/app/app.component.ts',
        'lib/src/app/app.module.ts',
        'lib/src/assets/.gitkeep',
        'lib/src/environments/environment.prod.ts',
        'lib/src/environments/environment.ts',
        'lib/src/app',
        'lib/src/assets',
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
        'lib/.nvmrc',
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
      projtectType: project._type,
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


        (() => {
          const source = path.join(
            projectLocation,
            config.folder.src,
            'lib'
          );

          const dest = path.join(
            projectLocation,
            this.project.isStandaloneProject
              ? replacement(tmpProjectsStandalone) : replacement(tmpProjects),
            `projects/${projectName}/src/lib`
          );
          Helpers.remove(dest);
          Helpers.createSymLink(source, dest);
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
          content = content.replace(new RegExp('my\\-lib', 'g'), projectName)
          Helpers.writeFile(f, content);
        });


      })
    });
    // @ts-ignore
    this.struct = result;
    //#endregion
  }

}


//#endregion
