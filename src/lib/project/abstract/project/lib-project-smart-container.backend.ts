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
      this.lib.location,
      this.lib.getTempProjName('bundle'),
      config.folder.node_modules,
      rootPackageName,
    )
    Helpers
      .foldersFrom(base)
      .forEach(absFolder => {

        this.lib.removeJsMapsFrom(absFolder);

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
      this.lib.location,
      this.lib.getTempProjName('bundle'),
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
            this.lib.removeTagAndCommit(automaticRelease)
          }

        });

    });

  }


  async buildDocs(prod: boolean) {
    // TODO

    await Helpers.questionYesNo(`Do you wanna build docs for github preview`, async () => {

      //#region questions
      let appBuildOptions = { docsAppInProdMode: prod, websql: false };

      await Helpers.questionYesNo(`Do you wanna build in production mode`, () => {
        appBuildOptions.docsAppInProdMode = true;
      }, () => {
        appBuildOptions.docsAppInProdMode = false;
      });

      await Helpers.questionYesNo(`Do you wanna use websql mode ?`, () => {
        appBuildOptions.websql = true;
      }, () => {
        appBuildOptions.websql = false;
      });

      Helpers.log(`

      Building docs prevew - start

      `);
      //#endregion

      const libBuildCOmmand = `${config.frameworkName} build:${config.folder.bundle} ${global.hideLog ? '' : '-verbose'} && `;
      await this.lib.run(`${libBuildCOmmand}`
        + `${config.frameworkName} build:${config.folder.bundle}:app:${appBuildOptions.docsAppInProdMode ? 'prod' : ''} `
        + `${appBuildOptions.websql ? '--websql' : ''} ${global.hideLog ? '' : '-verbose'}`).sync();


      Helpers.log(`

      Building docs prevew - done

      `);
    });
  }


}
