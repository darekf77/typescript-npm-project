import { CLI } from "tnp-cli";
import { config } from "tnp-config";
import { crossPlatformPath, path } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import { LibPorjectBase } from "./lib-project-base.backend";
import type { LibProject } from "./lib-project.backend";
import { Project } from "./project";

export class LibProjectSmartContainer extends LibPorjectBase {

  preparePackage(smartContainer: Project, newVersion: string) {
    const rootPackageName = `@${smartContainer.name}`;
    const base = path.join(
      this.project.location,
      this.project.getTempProjName('bundle'),
      config.folder.node_modules,
      rootPackageName,
    )
    Helpers
      .foldersFrom(base)
      .forEach(absFolder => {

        this.project.removeJsMapsFrom(absFolder);

        let proj = Project.From(absFolder) as Project;
        proj.packageJson.data.tnp.type = 'isomorphic-lib';
        proj.packageJson.data.tnp.version = config.defaultFrameworkVersion;
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
      this.project.getTempProjName('bundle'),
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


  async buildDocs(prod: boolean): Promise<boolean> {
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

      const toBuildWebsql = await Helpers
        .consoleGui
        .multiselect('Which project you want to build with WEBSQL mode', allProjects.map(childName => {
          return returnFun(childName);
        }))

      allProjects = allProjects.filter(f => !toBuildWebsql.includes(f));


      const toBuildNormally = allProjects.length === 0 ? [] : await Helpers
        .consoleGui
        .multiselect('Which projects you want to build with normally', allProjects.map(childName => {
          return returnFun(childName);
        }));

      //#region questions
      let appBuildOptions = { docsAppInProdMode: prod, websql: false };

      await Helpers.questionYesNo(this.messages.productionMode, () => {
        appBuildOptions.docsAppInProdMode = true;
      }, () => {
        appBuildOptions.docsAppInProdMode = false;
      });

      // await Helpers.questionYesNo(`Do you wanna use websql mode ?`, () => {
      //   appBuildOptions.websql = true;
      // }, () => {
      //   appBuildOptions.websql = false;
      // });

      Helpers.log(`

      Building docs prevew - start

      `);
      //#endregion

      await (async () => {
        const libBuildCOmmand = `${config.frameworkName} build:${config.folder.bundle} ${global.hideLog ? '' : '-verbose'}`;
        await smartContainer.run(libBuildCOmmand).sync();
      })();

      for (let index = 0; index < toBuildNormally.length; index++) {
        const projName = toBuildNormally[index];

        await this.project.run(`${config.frameworkName} `
          + `build:${config.folder.bundle}:app:${appBuildOptions.docsAppInProdMode ? 'prod' : ''} ${projName} `
          + `           ${global.hideLog ? '' : '-verbose'}`).sync();
      }

      for (let index = 0; index < toBuildWebsql.length; index++) {
        const projName = toBuildWebsql[index];

        await this.project.run(`${config.frameworkName} `
          + `build:${config.folder.bundle}:app:${appBuildOptions.docsAppInProdMode ? 'prod' : ''} ${projName} `
          + ` --websql ${global.hideLog ? '' : '-verbose'}`).sync();
      }


      Helpers.log(this.messages.docsBuildDone);
    });
  }


}
