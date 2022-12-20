import { config } from "tnp-config";
import { path } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import type { LibProject } from "./lib-project.backend";
import { Project } from "./project";


export class LibProjectSmartContainer {

  constructor(
    private lib: Project
  ) {

  }

  // @ts-ignore
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

  async publish(rootPackageName: string, newVersion: string, automaticRelease: boolean) {
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

    }, () => {
      process.exit(0);
    });

  }


  async buildDocs(prod: boolean, newVersion: string, realCurrentProj: Project) {
    // TODO
    return;
    await Helpers.questionYesNo(`Do you wanna build docs for github preview`, async () => {

      let appBuildOptions = { docsAppInProdMode: prod };

      await Helpers.questionYesNo(`Do you wanna build in production mode`, () => {
        appBuildOptions.docsAppInProdMode = true;
      }, () => {
        appBuildOptions.docsAppInProdMode = false;
      });

      Helpers.log(`

  Building docs prevew - start

  `);
      const init = this.lib.frameworkVersionAtLeast('v3') ? `${config.frameworkName} build:dist && ` : '';
      await this.lib.run(`${init}`
        + `${config.frameworkName} build:app${appBuildOptions.docsAppInProdMode ? 'prod' : ''}`).sync();

      if (this.lib.frameworkVersionAtLeast('v3')) {
        const currentDocs = path.join(this.lib.location, config.folder.docs);
        const currentDocsDest = path.join(this.lib.location, '..', '..', '..', '..', config.folder.docs);
        Helpers.removeFolderIfExists(currentDocsDest);
        Helpers.copy(currentDocs, currentDocsDest, { recursive: true })
      }

      Helpers.log(`

  Building docs prevew - done

  `);
      await this.lib.pushToGitRepo(newVersion, realCurrentProj)
    }, async () => {
      await this.lib.pushToGitRepo(newVersion, realCurrentProj)
    });
  }


}
