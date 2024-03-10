//#region imports
import { CLI } from "tnp-cli/src";
import { config } from "tnp-config/src";
import { crossPlatformPath, path } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { Models } from "tnp-models/src";
import { CLASS } from "typescript-class-helpers/src";
import { AppBuildConfig } from "../../features/docs-app-build-config.backend";
import { LibPorjectBase } from "./lib-project-base.backend";
import type { LibProject } from "./lib-project.backend";
import { Project } from "./project";
//#endregion

export class LibProjectSmartContainer extends LibPorjectBase {

  //#region prepare package
  preparePackage(smartContainer: Project, newVersion: string) {
    const rootPackageName = `@${smartContainer.name}`;
    const base = path.join(
      this.project.location,
      this.project.getTempProjName('dist'),
      config.folder.node_modules,
      rootPackageName,
    )
    Helpers
      .foldersFrom(base)
      .forEach(absFolder => {

        this.project.removeJsMapsFrom(absFolder);

        let proj = Project.From(absFolder) as Project;
        proj.packageJson.data.tnp.type = 'isomorphic-lib';
        proj.packageJson.data.tnp.version = smartContainer._frameworkVersion;
        proj.packageJson.save('updating version for publish');
        Project.unload(proj);
        proj = Project.From(absFolder) as Project;
        const child = smartContainer.children.find(c => c.name === path.basename(absFolder));
        const packgeJsonPath = proj.packageJson.path;
        const pj = Helpers.readJson(packgeJsonPath) as Models.npm.IPackageJSON;
        pj.version = newVersion;
        pj.name = `${rootPackageName}/${proj.name}`;
        delete pj.devDependencies;
        pj.dependencies = child.packageJson.data.tnp.overrided.dependencies;
        pj.peerDependencies = child.packageJson.data.peerDependencies;
        pj.engines = child.packageJson.data.engines;
        pj.homepage = child.packageJson.data.homepage;
        Helpers.writeJson(packgeJsonPath, pj);
        Project.unload(proj);
      });

  }
  //#endregion

  //#region publish
  async publish(options: {
    realCurrentProj: Project,
    newVersion: string,
    automaticRelease: boolean,
    prod: boolean,
    rootPackageName?: string,
  }) {

    const {
      realCurrentProj,
      newVersion,
      automaticRelease,
      prod,
      rootPackageName,
    } = options;

    const base = path.join(
      this.project.location,
      this.project.getTempProjName('dist'),
      config.folder.node_modules,
      rootPackageName,
    );

    Helpers.info(`Publish cwd: ${base}`)
    await Helpers.questionYesNo(`Publish on npm all new versions: ${newVersion} ?`, async () => {

      Helpers
        .foldersFrom(base)
        .forEach(cwd => {
          let successPublis = false;
          // const proj = Project.From(absFolder) as Project;

          try {
            Helpers.run('npm publish --access public', {
              cwd,
              output: true
            }).sync();
            successPublis = true;
          } catch (e) {
            this.project.removeTagAndCommit(automaticRelease)
          }

        });

    });

  }
  //#endregion

  //#region build docs
  async buildDocs(prod: boolean, realCurrentProj: Project, automaticReleaseDocs: boolean, libBuildCallback: (websql: boolean, prod: boolean) => any): Promise<boolean> {
    // TODO

    const smartContainer = this.project;
    const mainProjectName = smartContainer.smartContainerBuildTarget.name
    const otherProjectNames = this.project
      .children
      .filter(c => c.name !== mainProjectName)
      .map(p => p.name)

    let allProjects = [
      mainProjectName,
      ...otherProjectNames,
    ];

    Helpers.info(`
Smart container routes for project:
+ ${CLI.chalk.bold(mainProjectName)} => /${mainProjectName}
${otherProjectNames.map(c => `+ ${CLI.chalk.bold(c)} => /${mainProjectName}/-/${c}`).join('\n')}
        `);


    return await Helpers.questionYesNo(this.messages.docsBuildQuesions, async () => {

      const returnFun = (childName: string) => {
        if (childName === mainProjectName) {
          return {
            name: childName, // + CLI.chalk.gray(`\t\t<url>/${mainProjectName}`),
            value: childName,
          };
        }
        return {
          name: childName, // + CLI.chalk.gray(`\t\t<url>/${mainProjectName}/-/${childName}`),
          value: childName,
        };
      }


      const toBuildWebsqlCFG = [
        ...((realCurrentProj.docsAppBuild.config.build && realCurrentProj.docsAppBuild.config.websql) ? [mainProjectName] : []),
        ...(realCurrentProj.docsAppBuild.config.children.map(c => {
          if (c.build && c.websql) {
            return c.projName;
          }
        }).filter(f => !!f)),
      ];

      const toBuildNormallyCFG = [
        ...((realCurrentProj.docsAppBuild.config.build && !realCurrentProj.docsAppBuild.config.websql) ? [mainProjectName] : []),
        ...(realCurrentProj.docsAppBuild.config.children.map(c => {
          if (c.build && !c.websql) {
            return c.projName;
          }
        }).filter(f => !!f)),
      ];



      let toBuildWebsql = automaticReleaseDocs ? toBuildWebsqlCFG : (await Helpers
        .consoleGui
        .multiselect('Which project you want to build with WEBSQL mode', allProjects.map(childName => {
          return returnFun(childName);
        })))

      allProjects = allProjects.filter(f => !toBuildWebsql.includes(f));


      let toBuildNormally = automaticReleaseDocs ? toBuildNormallyCFG : (allProjects.length === 0 ? [] : (await Helpers
        .consoleGui
        .multiselect('Which projects you want to build with normally', allProjects.map(childName => {
          return returnFun(childName);
        }))));

      //#region questions
      let appBuildOptions = { docsAppInProdMode: prod, websql: false };

      await Helpers.questionYesNo(this.messages.productionMode, () => {
        appBuildOptions.docsAppInProdMode = true;
      }, () => {
        appBuildOptions.docsAppInProdMode = false;
      });

      if (automaticReleaseDocs) {
        appBuildOptions.docsAppInProdMode = realCurrentProj.docsAppBuild.config.prod;
        appBuildOptions.websql = realCurrentProj.docsAppBuild.config.websql;
      }

      const cfg: AppBuildConfig = {
        build: ([...toBuildWebsql, ...toBuildNormally].includes(mainProjectName)),
        prod: appBuildOptions.docsAppInProdMode,
        websql: toBuildWebsql.includes(mainProjectName),
        projName: mainProjectName,
        children: [
          ...toBuildWebsql.filter(c => c !== mainProjectName).map(c => {
            return {
              build: true,
              prod: appBuildOptions.docsAppInProdMode,
              websql: true,
              projName: c,
            }
          }),
          ...toBuildNormally.filter(c => c !== mainProjectName).map(c => {
            return {
              build: true,
              prod: appBuildOptions.docsAppInProdMode,
              websql: false,
              projName: c,
            }
          })
        ]
      };

      realCurrentProj.docsAppBuild.save(cfg)

      // await Helpers.questionYesNo(`Do you wanna use websql mode ?`, () => {
      //   appBuildOptions.websql = true;
      // }, () => {
      //   appBuildOptions.websql = false;
      // });

      Helpers.log(`

      Building /docs folder preview app - start

      `);
      //#endregion

      await Helpers.runSyncOrAsync(libBuildCallback);

      // (() => {
      //   const libBuildCOmmand = `${config.frameworkName} build:${config.folder.dist} ${global.hideLog ? '' : '-verbose'}`;
      //   smartContainer.run(libBuildCOmmand).sync();
      // })();


      const cmd = (childProjName: string, productinoBuild: boolean, websqlBuild: boolean, isMainTarget = false) => {
        const commandToBuildDOcs = `${config.frameworkName} `
          + `build:app:${productinoBuild ? 'prod' : ''} ${childProjName} `
          + `  ${websqlBuild ? '--websql' : ''}         ${global.hideLog ? '' : '-verbose'}`

        // console.log({
        //   commandToBuildDOcs
        // })

        this.project.run(commandToBuildDOcs).sync();

        const assetsListPathSourceMain = crossPlatformPath([
          crossPlatformPath(path.resolve(path.join(this.project.location, '..'))),
          realCurrentProj.name,
          config.folder.dist,
          realCurrentProj.name,
          childProjName,
          `tmp-apps-for-${config.folder.dist}${websqlBuild ? '-websql' : ''}`,
          childProjName,
          config.folder.src,
          config.folder.assets,
          realCurrentProj.assetsFileListGenerator.filename,
        ])
        const assetsListPathDestMain = crossPlatformPath([
          realCurrentProj.location,
          config.folder.docs,
          ...(isMainTarget ? [] : ['-' + childProjName]),
          config.folder.assets,
          realCurrentProj.assetsFileListGenerator.filename,
        ]);
        // console.log({
        //   assetsListPathSourceMain,
        //   assetsListPathDestMain,
        // })
        Helpers.copyFile(assetsListPathSourceMain, assetsListPathDestMain);
      }

      cmd(cfg.projName, cfg.prod, cfg.websql, true);



      const children = cfg.children || [];
      for (let index = 0; index < children.length; index++) {
        const { websql, prod, projName } = children[index];
        cmd(projName, prod, websql);
      }

      try {
        realCurrentProj.run('git checkout docs/CNAME').sync();
      } catch (error) { }


      Helpers.log(this.messages.docsBuildDone);
    });
  }
  //#endregion

}
