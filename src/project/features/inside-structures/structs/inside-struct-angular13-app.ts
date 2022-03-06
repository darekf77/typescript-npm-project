//#region @backend
import { CLASS } from 'typescript-class-helpers';
import { crossPlatformPath, path, _ } from 'tnp-core';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../../abstract/project/project';
import { InsideStruct } from '../inside-struct';
import { BaseInsideStruct } from './base-inside-struct';
import { config } from 'morphi';
import * as cheerio from 'cheerio';

@CLASS.NAME('InsideStructAngular13App')
export class InsideStructAngular13App extends BaseInsideStruct {

  private constructor(project: Project) {
    super(project);
    //#region @backend
    if (!project.frameworkVersionAtLeast('v3')) {
      return
    }
    const tmpProjectsStandalone = `tmp-apps-for-{{{outFolder}}}/${project.name}`;
    const tmpProjects = `tmp-apps-for-{{{outFolder}}}/${project.name}--for--{{{client}}}`;
    const result = InsideStruct.from({

      relateivePathesFromContainer: [
        //#region releative pathes from core project
        'app/src/app/app.component.html',
        'app/src/app/app.component.scss',
        'app/src/app/app.component.spec.ts',
        'app/src/app/app.component.ts',
        'app/src/app/app.module.ts',
        'app/src/assets/.gitkeep',
        'app/src/environments/environment.prod.ts',
        'app/src/environments/environment.ts',
        'app/src/app',
        'app/src/environments',
        'app/src/favicon.ico',
        'app/src/index.html',
        'app/src/main.ts',
        'app/src/polyfills.ts',
        'app/src/styles.scss',
        'app/src/test.ts',
        'app/src/manifest.webmanifest',
        'app/ngsw-config.json',
        'app/.browserslistrc',
        'app/.editorconfig',
        'app/.gitignore',
        // 'app/README.md',
        'app/angular.json',
        'app/karma.conf.js',
        'app/package-lock.json',
        'app/package.json',
        'app/tsconfig.app.json',
        'app/tsconfig.json',
        'app/tsconfig.spec.json',
        //#endregion
      ],
      projtectType: project._type,
      frameworkVersion: project._frameworkVersion,
      pathReplacements: [
        ['app/', ({ client }) => {
          if (project.isStandaloneProject) {
            return `${tmpProjectsStandalone}/`;
          }
          return `${tmpProjects}/`;
        }],
      ],
      linkNodeModulesTo: ['app/'],
      linksFuncs: [
        //#region what and where needs to linked
        [
          ({ outFolder, client }) => {
            if (project.isStandaloneProject) {
              return `tmp-src-${outFolder}`;
            }
            return `tmp-src-${outFolder}-browser-for-{{{client}}}`;
          },
          ({ projectName }) => `app/src/app/${projectName}`,
        ],
        //#endregion
      ],
      endAction: (({ outFolder, projectName, client, replacement }) => {
        //#region action after recreating/updating inside strcut

        //#region replace app.module.ts
        (() => {
          const appModuleFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/app/app.module.ts`
          );

          let appModuleFile = Helpers.readFile(appModuleFilePath);

          const moduleName = _.upperFirst(_.camelCase(project.name)) + 'Module';
          appModuleFile = `
import { ${moduleName} } from './${projectName}/app';
${appModuleFile}
`;
          appModuleFile = appModuleFile.replace(
            '//<<<TO_REPLACE_MODULE>>>',
            `${moduleName},`
          );
          Helpers.writeFile(appModuleFilePath, appModuleFile);
        })();
        //#endregion

        //#region replace app.component.html
        (() => {
          const appModuleFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/app/app.component.html`
          );

          let appHtmlFile = Helpers.readFile(appModuleFilePath);

          const tagName = `<app-${project.name}>`;

          appHtmlFile = appHtmlFile.replace(
            '<!-- <<<TO_REPLACE_COMPONENT_TAG>>> -->',
            `${tagName}, `
          );
          Helpers.writeFile(appModuleFilePath, appHtmlFile);
        })();
        //#endregion

        //#region link assets
        (() => {

          const assetsSource = crossPlatformPath(path.join(
            project.location,
            config.folder.src,
            config.folder.assets,
          ))

          if (!Helpers.exists(assetsSource)) {
            Helpers.mkdirp(assetsSource);
          }

          const assetsDest = crossPlatformPath(path.join(
            project.location
            ,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects)
            ,
            `/src/assets`
          ));

          Helpers.remove(assetsDest);
          Helpers.createSymLink(assetsSource, assetsDest)

        })();
        //#endregion

        //#region rebuild manifest
        (() => {

          const manifestJsonPath = crossPlatformPath(path.join(
            project.location
            ,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects)
            ,
            `/src/manifest.webmanifest`
          ));

          const manifestJson: {
            "name": string;//  "app",
            "short_name": string;//  "app",
            "theme_color": string;// "#1976d2",
            "background_color": string;//  "#fafafa",
            "display": "standalone",
            "scope": string;// "./",
            "start_url": string;//  "start_url": "./", => "start_url" "https://darekf77.github.io/bs4-breakpoint/"
            icons: {
              "src": string; // "assets/icons/icon-96x96.png",
              "sizes": string; // "96x96",
              "type": string; // "image/png",
              "purpose": string; // "maskable any"
            }[];
          } = Helpers.readJson(manifestJsonPath, {}, true);

          manifestJson.name = _.startCase(project.name);
          manifestJson.short_name = project.name;

          const assetsPath = crossPlatformPath(path.join(
            project.location,
            config.folder.src,
            config.folder.assets
          ));



          const iconsPath = crossPlatformPath(path.join(
            assetsPath,
            'icons'
          ));


          const iconsFilesPathes = Helpers.filesFrom(iconsPath).filter(f => {
            // @ts-ignore
            return Models.other.ImageFileExtensionArr.includes(path.extname(f as any).replace('.', ''));
          }); // glob.sync(`${iconsPath}/**/*.(png|jpeg|svg)`);

          manifestJson.icons = iconsFilesPathes.map(f => {
            return {
              src: f.replace(`${path.dirname(assetsPath)}/`, ''),
              sizes: _.last(path.basename(f).replace(path.extname(f), '').split('-')),
              type: `image/${path.extname(f).replace('.', '')}`,
              purpose: "maskable any"
            }
          });

          const origin = project.git.originURL;
          if (origin.search('github.com') !== -1) {
            const remoteUsername = _.first(Helpers.arrays.second(origin
              .replace('https://', '')
              .replace('http://', '')
              .split('/')).split(':'))

            manifestJson.start_url = `https://${remoteUsername}.github.io/${project.name}/`
          }


          Helpers.writeJson(manifestJsonPath, manifestJson);

        })();
        //#endregion


        //#region inject environment => done throught reading json
        (() => {

          // const indexHtml = crossPlatformPath(path.join(
          //   project.location
          //   ,
          //   replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects)
          //   ,
          //   `/src/index.html`
          // ));

          // const $ = cheerio.load(Helpers.readFile(indexHtml));

          // $('body').append(`
          // <script>
          // if (global === undefined) {
          //   var global = window;
          // }
          // var ENV = ${JSON.stringify(project.env.config)};
          // window.ENV = ENV;
          // global.ENV = ENV;
          // </script>

          // `);
          // Helpers.writeFile(indexHtml, $.html())

        })();
        //#endregion

        //#region when app.ts or app is not available is not
        (() => {
          const appFile = crossPlatformPath(path.join(
            project.location,
            config.folder.src,
            'app.ts'
          ));

          const appFolder = crossPlatformPath(path.join(
            project.location,
            config.folder.src,
            'app'
          ));

          if (!Helpers.exists(appFile) || !Helpers.exists(appFolder)) {
            const componentName = `${_.upperFirst(_.camelCase(project.name))}Component`;
            const moduleName = `${_.upperFirst(_.camelCase(project.name))}Module`;

            Helpers.writeFile(appFile, `

//#region @notForNpm
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-${project.name}',
  template: 'hello from ${project.name}'
})
export class ${componentName} implements OnInit {
  constructor() { }

  ngOnInit() { }
}

@NgModule({
  imports: [],
  exports: [${componentName}],
  declarations: [${componentName}],
  providers: [],
})
export class ${moduleName} { }
//#endregion

//#region @backend
async function start(port: number)  {

}

export default start;

//#endregion

//#endregion



            `.trim());
          }



        })();
        //#endregion


        //#endregion
      })
    });
    // @ts-ignore
    this.struct = result;
    //#endregion
  }

}




//#endregion
