//#region @backend
import { CLASS } from 'typescript-class-helpers';
import { crossPlatformPath, path, _ } from 'tnp-core';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { Project } from '../../../abstract/project/project';
import { InsideStruct } from '../inside-struct';
import { BaseInsideStruct } from './base-inside-struct';
import { recreateApp } from './inside-struct-helpers';
import { config } from 'tnp-config';

@CLASS.NAME('InsideStructAngular13App')
export class InsideStructAngular13App extends BaseInsideStruct {

  private constructor(project: Project, websql: boolean) {
    super(project, websql);
    //#region @backend
    if (!project.frameworkVersionAtLeast('v3') || project.typeIsNot('isomorphic-lib')) {
      return
    }
    const tmpProjectsStandalone = `tmp-apps-for-{{{outFolder}}}${this.websql ? '-websql' : ''}/${project.name}`;
    const tmpProjects = `tmp-apps-for-{{{outFolder}}}${this.websql ? '-websql' : ''}/${project.name}--for--{{{client}}}`;
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
              return `tmp-src-${outFolder}${this.websql ? '-websql' : ''}`;
            }
            return `tmp-src-${outFolder}${this.websql ? '-websql' : ''}-browser-for-{{{client}}}`;
          },
          ({ projectName }) => `app/src/app/${projectName}`,
        ],
        //#endregion
      ],
      endAction: (({ outFolder, projectName, client, watchBuild, replacement }) => {
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

          if (!watchBuild) { // TODO it will colide with ng serve ?
            appModuleFile = appModuleFile
              .replace(new RegExp(Helpers.escapeStringForRegEx('//bundleOnly'), 'g'), '');
          }

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
            `${tagName} `
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

        //#region  assets syncing - NOW WORKING SYMLINKS IN SRC
        (() => {

          // const anuglarJsonPath = crossPlatformPath(path.join(
          //   project.location
          //   ,
          //   replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects)
          //   ,
          //   `/angular.json`
          // ));

          // const json = Helpers.readJson(anuglarJsonPath, void 0, true);
          // // console.log(anuglarJsonPath)
          // // console.log(json)
          // const assets = json.projects.app.architect.build.options.assets;
          // if (this.project.isSmartContainerTarget) {
          //   const parent = Project.From(project.smartContainerTargetParentContainerPath);
          //   parent.children.map(c => {
          //     assets.push(`src/app/${project.name}/assets/${c.name}/assets`);
          //   });
          //   json.projects.app.architect.build.options.assets = Helpers.arrays.uniqArray(assets);
          // } else {

          // }

          // Helpers.writeFile(anuglarJsonPath, json)

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

        recreateApp(project);

        //#region add proper pathes to tsconfig
        (() => {
          const tsconfigJSONpath = crossPlatformPath(path.join(
            project.location
            ,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects)
            ,
            `/tsconfig.json`
          ));

          const libsPathes = crossPlatformPath(path.join(
            project.location, `src/libs`
          ));

          const content = Helpers.readJson(tsconfigJSONpath, void 0, true);


          let libs = Helpers.linksToFoldersFrom(libsPathes);
          const parentPath = path.resolve(path.join(project.location, '../../..'));

          const parent = Project.From(parentPath) as Project;
          if (parent && parent.isSmartContainer && libs.length > 0 && content.compilerOptions) {

            // console.log('tsconfigJSON', tsconfigJSONpath, content)
            // console.log('libsPathes', libsPathes)
            // console.log(`libs`, libs)
            // console.log(`PARENT PATH: ${parentPath}  `)

            content.compilerOptions.paths = ((libs).reduce((a, b) => {
              const pathRelative = b
                .replace(parent.location, '')
                .split('/')
                .slice(4)
                .join('/')
                .replace('src/', `src/app/${project.name}/`)
                ;
              return _.merge(a, {
                [`@${parent.name}/${path.basename(b)}/${this.websql ? config.folder.websql : config.folder.browser}`]: [`./${pathRelative}`],
                [`@${parent.name}/${path.basename(b)}/${this.websql ? config.folder.websql : config.folder.browser}/*`]: [`./${pathRelative}/*`],
              })
            }, {}));
            Helpers.writeJson(tsconfigJSONpath, content);
          }

          // console.info(JSON.stringify(content.compilerOptions, null, 4))

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
