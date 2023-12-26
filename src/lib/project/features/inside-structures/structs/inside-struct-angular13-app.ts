//#region @backend
import { CLASS } from 'typescript-class-helpers/src';
import { crossPlatformPath, path, _ } from 'tnp-core/src';
import { Models } from 'tnp-models/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../../abstract/project/project';
import { InsideStruct } from '../inside-struct';
import { BaseInsideStruct } from './base-inside-struct';
import { resolvePathToAsset } from './inside-struct-helpers';
import { config } from 'tnp-config/src';
import { getLoader } from './loaders/loaders';
import { ID_LOADER_PRE_BOOTSTRAP, PRE_LOADER_NG_IF_INITED } from './inside-struct-constants';
import { imageLoader } from './loaders/image-loader';

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
        // 'app/src/app/app.component.spec.ts', -> something better needed
        'app/src/app/app.component.ts',
        'app/src/app/app.module.ts',
        'app/src/environments/environment.prod.ts',
        'app/src/environments/environment.ts',
        'app/src/app',
        'app/src/environments',
        'app/src/favicon.ico',
        'app/src/index.html',
        'app/src/main.ts',
        'app/src/polyfills.ts',
        'app/src/styles.scss',
        'app/src/jestGlobalMocks.ts',
        'app/src/setupJest.ts',
        // 'app/src/test.ts',  // node needed for jest test - (but the don' work wit symlinks)
        'app/src/manifest.webmanifest',
        'app/ngsw-config.json',
        'app/.browserslistrc',
        'app/.editorconfig',
        'app/.gitignore',
        // 'app/README.md',
        'app/angular.json',
        'app/jest.config.js',
        'app/karma.conf.js',
        'app/package-lock.json',
        'app/package.json',
        'app/tsconfig.app.json',
        'app/tsconfig.json',
        'app/tsconfig.spec.json',
        //#endregion
      ],
      projectType: project._type,
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
          (opt) => {
            const { outFolder, projectName, client } = opt;
            if (project.isStandaloneProject) {
              const standalonePath = `tmp-src-app-${outFolder}${this.websql ? '-websql' : ''}`;
              if (client.isSmartContainerTarget) {
                const targetProj = client.smartContainerTargetParentContainer.smartContainerBuildTarget;
                if (targetProj.name !== client.name) {
                  // console.log(`${targetProj.name} vs ${client?.name}`)
                  return `../${targetProj.name}/${standalonePath}/-/${client.name}`;
                }
              }
              return standalonePath;
            }
            return `tmp-src-app-${outFolder}${this.websql ? '-websql' : ''}-browser-for-{{{client}}}`;
          },
          (opt) => {
            const { projectName, client } = opt;
            const standalonePath = `app/src/app/${projectName}`;
            if (client.isSmartContainerTarget) {
              const targetProj = client.smartContainerTargetParentContainer.smartContainerBuildTarget;
              if (targetProj.name !== client.name) {
                return `${standalonePath}/app`;
              }
            }
            return standalonePath
          },
        ],
        //#endregion

        //#region link not containter target clients
        [
          (opt) => {
            const { outFolder, projectName, client } = opt;
            if (project.isStandaloneProject) {
              const standalonePath = `tmp-src-${outFolder}${this.websql ? '-websql' : ''}`;
              if (client.isSmartContainerTarget) {
                const targetProj = client.smartContainerTargetParentContainer.smartContainerBuildTarget;
                if (targetProj.name !== client.name) {
                  // console.log(`assets  ${targetProj.name} vs ${client?.name}`)
                  return `../${targetProj.name}/${standalonePath}/assets`;
                }
              }
            }
            return '';
          },
          (opt) => {
            const { projectName, client } = opt;
            if (client.isSmartContainerTarget) {
              const targetProj = client.smartContainerTargetParentContainer.smartContainerBuildTarget;
              if (targetProj.name !== client.name) {
                return `app/src/assets`;
              }
            }
            return '';
          },
        ],
        //#endregion

        //#region link not containter target clients - whole dist or bundle
        [
          (opt) => {
            const { projectName, client, outFolder } = opt;
            if (client.isSmartContainerTarget) {
              const targetProj = client.smartContainerTargetParentContainer.smartContainerBuildTarget;
              if (targetProj.name !== client.name) {
                return `../${targetProj.name}/${outFolder}`;
              }
            }
            return '';
          },
          (opt) => {
            const { projectName, client, outFolder } = opt;
            if (client.isSmartContainerTarget) {
              const targetProj = client.smartContainerTargetParentContainer.smartContainerBuildTarget;
              if (targetProj.name !== client.name) {
                return `${outFolder}/compiled`;
              }
            }
            return '';
          },
        ]
        //#endregion
      ],
      endAction: (async ({ outFolder, projectName, client, watchBuild, replacement }) => {
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

        //#region replace app.component.ts
        (() => {
          const appComponentFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/app/app.component.ts`
          );


          let appComponentFile = Helpers.readFile(appComponentFilePath);

          appComponentFile = appComponentFile.replace(
            `import { Firedev } from 'firedev/src';`,
            `import { Firedev } from 'firedev/${this.websql ? config.folder.websql : config.folder.browser}/src';`,
          );

          appComponentFile = appComponentFile.replace(
            `import { Morphi } from 'morphi/src';`,
            `import { Morphi } from 'morphi/${this.websql ? config.folder.websql : config.folder.browser}/src';`,
          );

          appComponentFile = appComponentFile.replace(
            `from 'firedev-ui/src';`,
            `from 'firedev-ui/${this.websql ? config.folder.websql : config.folder.browser}/src';`,
          );

          appComponentFile = appComponentFile.replace(
            `import start from './---projectname---/app';`,
            `import start from './${this.project.name}/app';`,
          );

          Helpers.writeFile(appComponentFilePath, appComponentFile);
        })();
        //#endregion

        //#region replace app.module.ts
        (() => {
          const appComponentFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/app/app.module.ts`
          );


          let appModuleFile = Helpers.readFile(appComponentFilePath);

          appModuleFile = appModuleFile.replace(
            `import { FiredevAdminModeConfigurationModule } from 'firedev-ui/src';`,
            `import { FiredevAdminModeConfigurationModule } from 'firedev-ui/${this.websql ? config.folder.websql : config.folder.browser}/src';`,
          );

          Helpers.writeFile(appComponentFilePath, appModuleFile);
        })();
        //#endregion

        //#region replace main.ts websql things
        (() => {
          const appMainFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/main.ts`
          );


          let appMainFile = Helpers.readFile(appMainFilePath);


          if (!this.websql) {
            appMainFile = appMainFile.replace(
              `require('sql.js');`,
              `(arg: any) => {
                console.error('This should not be available in non-sql mode');
                return void 0;
              };`
            );
          }

          appMainFile = appMainFile.replace(
            `import { Helpers } from 'tnp-core/src';`,
            `import { Helpers } from 'tnp-core/${this.websql ? config.folder.websql : config.folder.browser}/src';`,
          )

          appMainFile = appMainFile.replace(
            `import { FiredevAdmin } from 'firedev-ui/src';`,
            `import { FiredevAdmin } from 'firedev-ui/${this.websql ? config.folder.websql : config.folder.browser}/src';`,
          )

          appMainFile = appMainFile.replace(
            `import { Stor } from 'firedev-storage/src';`,
            `import { Stor } from 'firedev-storage/${this.websql ? config.folder.websql : config.folder.browser}/src';`,
          );


          Helpers.writeFile(appMainFilePath, appMainFile);
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

          const tagName = `<app-${project.name}></app-${project.name}>`;

          appHtmlFile = appHtmlFile.replace(
            '<!-- <<<TO_REPLACE_COMPONENT_TAG>>> -->',
            `${tagName} `
          );
          Helpers.writeFile(appModuleFilePath, appHtmlFile);
        })();
        //#endregion

        //#region LOADERS & BACKGROUNDS REPLACEMENT
        (() => {
          const projectTargetOrStandalone = this.project;
          const basename = this.project.isInRelaseBundle ?
            `/${(this.project.isSmartContainerTarget ? this.project.smartContainerTargetParentContainer.name : this.project.name)}`
            : '';

          // if(projectTargetOrStandalone.name === 'main') {
          //   console.log({
          //     loading: JSON.stringify(projectTargetOrStandalone?.env.config?.loading),
          //   })
          // }

          //#region LOADERS & BACKGROUNDS REPLACEMENT / replace app.component.html loader
          (() => {
            const appModuleHtmlPath = path.join(
              project.location,
              replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
              `/src/app/app.component.html`
            );

            let appHtmlFile = Helpers.readFile(appModuleHtmlPath);

            const loaderData = projectTargetOrStandalone.env.config?.loading?.afterAngularBootstrap?.loader;
            const loaderIsImage = _.isString(loaderData);

            if (loaderIsImage) {
              const pathToAsset = basename + resolvePathToAsset(projectTargetOrStandalone, loaderData, outFolder, websql);
              appHtmlFile = appHtmlFile.replace(
                '<!-- <<<TO_REPLACE_LOADER>>> -->',
                imageLoader(pathToAsset, false),
              );
            } else {
              const loaderToReplace = getLoader((loaderData?.name) as any, loaderData?.color, false)
              appHtmlFile = appHtmlFile.replace(
                '<!-- <<<TO_REPLACE_LOADER>>> -->',
                loaderToReplace,
              );
            }

            Helpers.writeFile(appModuleHtmlPath, appHtmlFile);
          })();
          //#endregion

          //#region LOADERS & BACKGROUNDS REPLACEMENT / replace app.component.ts body  background color
          (() => {
            const appModuleFilePath = path.join(
              project.location,
              replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
              `/src/app/app.component.ts`
            );

            let appScssFile = Helpers.readFile(appModuleFilePath);

            const bgColor = projectTargetOrStandalone.env.config?.loading?.afterAngularBootstrap?.background;
            if (bgColor) {
              appScssFile = appScssFile.replace(
                'FIREDEV_TO_REPLACE_COLOR',
                bgColor,
              );
            }
            Helpers.writeFile(appModuleFilePath, appScssFile);
          })();
          //#endregion

          //#region LOADERS & BACKGROUNDS REPLACEMENT / replace index.html body background color & loader
          (() => {
            const appModuleFilePath = path.join(
              project.location,
              replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
              `/src/index.html`
            );

            let indexHtmlFile = Helpers.readFile(appModuleFilePath);

            const loaderData = projectTargetOrStandalone.env.config?.loading?.preAngularBootstrap?.loader;
            const loaderIsImage = _.isString(loaderData);

            if (loaderIsImage) {
              const pathToAsset = projectTargetOrStandalone.env.config?.useDomain ? '' : basename + resolvePathToAsset(projectTargetOrStandalone, loaderData, outFolder, websql);
              indexHtmlFile = indexHtmlFile.replace(
                '<!-- <<<TO_REPLACE_LOADER>>> -->',
                imageLoader(pathToAsset, true),
              );
            } else {
              const loaderToReplace = getLoader((loaderData?.name) as any, loaderData?.color, true);
              indexHtmlFile = indexHtmlFile.replace(
                '<!-- <<<TO_REPLACE_LOADER>>> -->',
                loaderToReplace,
              );
            }

            const bgColor = projectTargetOrStandalone.env.config?.loading?.preAngularBootstrap?.background;
            const bgColorStyle = bgColor ? `style="background-color: ${bgColor};"` : '';
            indexHtmlFile = indexHtmlFile.replace(
              'FIREDEV_TO_REPLACE_COLOR',
              bgColorStyle,
            );

            Helpers.writeFile(appModuleFilePath, indexHtmlFile);
          })();
          //#endregion


        })();
        //#endregion

        //#region replace app.component.html
        (() => {
          const indexHtmlFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/index.html`
          );

          let indexHtmlFile = Helpers.readFile(indexHtmlFilePath);

          const title = this.project.env.config?.title;
          const titleToReplace = title ? title : _.startCase(this.project.name);
          // console.log({
          //   titleToReplace
          // })
          indexHtmlFile = indexHtmlFile.replace(
            '<title>App</title>',
            `<title>${titleToReplace}</title>`
          );
          Helpers.writeFile(indexHtmlFilePath, indexHtmlFile);
        })();
        //#endregion

        //#region replace app.component.html
        (() => {
          const mainFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/main.ts`
          );

          let mainTsFile = Helpers.readFile(mainFilePath);

          const basename = this.project.isInRelaseBundle ?
            `/${(this.project.isSmartContainerTarget ? this.project.smartContainerTargetParentContainer.name : this.project.name)}`
            : '';

          const projForName = project.isSmartContainerTarget ? project.smartContainerTargetParentContainer : project;

          if (projForName.env.config?.useDomain) {
            mainTsFile = mainTsFile.replace(
              '<<<TO_REPLACE_BASENAME>>>',
              '',
            );
          } else {
            mainTsFile = mainTsFile.replace(
              '<<<TO_REPLACE_BASENAME>>>',
              basename,
            );
          }

          Helpers.writeFile(mainFilePath, mainTsFile);
        })();
        //#endregion

        //#region replace style.scss
        (() => {
          const stylesFilePath = path.join(
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/styles.scss`
          );

          let stylesScssFile = Helpers.readFile(stylesFilePath);

          const basename = this.project.isInRelaseBundle ?
            `/${(this.project.isSmartContainerTarget ? this.project.smartContainerTargetParentContainer.name : this.project.name)}`
            : '';

          const projForName = project.isSmartContainerTarget ? project.smartContainerTargetParentContainer : project;

          if (projForName.env.config?.useDomain) {
            stylesScssFile = stylesScssFile.replace(
              '<<<TO_REPLACE_BASENAME>>>',
              '',
            );
          } else {
            stylesScssFile = stylesScssFile.replace(
              '<<<TO_REPLACE_BASENAME>>>',
              basename,
            );
          }

          Helpers.writeFile(stylesFilePath, stylesScssFile);
        })();
        //#endregion

        //#region replace favicon.ico
        (() => {
          const faviconPathDest = crossPlatformPath([
            project.location,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects),
            `/src/favicon.ico`
          ]);

          const source = crossPlatformPath([
            project.location,
            `/src/assets/favicon.ico`
          ]);

          if (Helpers.exists(source)) {
            Helpers.copyFile(source, faviconPathDest);
          }
        })();
        //#endregion

        //#region link assets
        (() => {

          if (client.isSmartContainerTarget) {
            const targetProj = client.smartContainerTargetParentContainer.smartContainerBuildTarget;
            if (targetProj.name !== client.name) {
              return;
            }
          }

          const assetsSource = crossPlatformPath(path.join(
            project.location,
            replacement('tmp-src-{{{outFolder}}}'),
            config.folder.assets,
          ));

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

        //#region rebuild manifest + index.html
        await (async () => {

          const manifestJsonPath = crossPlatformPath(path.join(
            project.location
            ,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects)
            ,
            `/src/manifest.webmanifest`
          ));

          const indexHtmlPath = crossPlatformPath(path.join(
            project.location
            ,
            replacement(project.isStandaloneProject ? tmpProjectsStandalone : tmpProjects)
            ,
            `/src/index.html`
          ));
          const projectTargetOrStandalone = this.project;

          const manifestJson: Models.pwa.Manifest = Helpers.readJson(manifestJsonPath, {}, true);
          let indexHtml = Helpers.readFile(indexHtmlPath);

          manifestJson.name = projectTargetOrStandalone.env.config?.pwa?.name
            ? projectTargetOrStandalone.env.config.pwa.name : _.startCase(project.name);

          manifestJson.short_name = projectTargetOrStandalone.env.config?.pwa?.short_name
            ? projectTargetOrStandalone.env.config.pwa.short_name : project.name;

          const assetsPath = crossPlatformPath(path.join(
            project.location,
            config.folder.src,
            config.folder.assets
          ));

          if (projectTargetOrStandalone.branding.exist) {
            //#region apply pwa generated icons
            manifestJson.icons = projectTargetOrStandalone.branding.iconsToAdd;
            //#endregion
            indexHtml = indexHtml.replace(`<link rel="icon" type="image/x-icon" href="favicon.ico">`, '')
            indexHtml = indexHtml.replace(
              projectTargetOrStandalone.branding.htmlIndexRepaceTag,
              projectTargetOrStandalone.branding.htmlLinesToAdd.join('\n')
            );
            indexHtml = indexHtml.replace(
              `<link rel="icon" type="image/x-icon" href="/`,
              `<link rel="icon" type="image/x-icon" href="`
            )
          } else {
            //#region apply default icons
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
            //#endregion
          }

          // const basename = this.isInRelaseBundle ?
          //   `${(this.project.isSmartContainerTarget ? this.project.smartContainerTargetParentContainer.name : this.project.name)}/`
          //   : '';

          manifestJson.icons = manifestJson.icons.map(c => {
            c.src = c.src.replace(/^\//, '');
            return c;
          });

          if (projectTargetOrStandalone.env.config?.pwa?.start_url) {
            manifestJson.start_url = (projectTargetOrStandalone.env.config as any).pwa.start_url;
          } else if (projectTargetOrStandalone.env.config?.useDomain) {
            manifestJson.start_url = `https://${projectTargetOrStandalone.env.config.domain}/`
          } else {
            const smartContainerOrStandalone = this.project.isSmartContainerTarget ? this.project.smartContainerTargetParentContainer : this.project;
            manifestJson.start_url = `/${smartContainerOrStandalone.name}/` // perfect for github.io OR when subdomain myproject.com/docs/
          }

          Helpers.writeJson(manifestJsonPath, manifestJson);
          Helpers.writeFile(indexHtmlPath, indexHtml);

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
          const parentPath = crossPlatformPath(path.resolve(path.join(project.location, '../../..')));

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
