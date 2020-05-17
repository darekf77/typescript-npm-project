import * as _ from 'lodash';
import * as glob from 'glob';
import * as path from 'path';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import { FeatureForProject, Project } from '../abstract';
import { ProjectFactory } from '../../scripts/NEW-PROJECT_FILES_MODULES/project-factory.backend';
import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';


export class SingularBuild extends FeatureForProject {
  singularWatchProj: Project;
  async init(watch: boolean, prod: boolean) {

    Helpers.log(`[singular build]
    FOP: ${this.project.genericName},
    TYPE: ${this.project._type},
    LOCATION: ${this.project.location}
    `);

    const children = this.project.children
      .filter(c => c.location !== this.project.location)
      .filter(c => !c.name.startsWith('tnp'))
      .filter(c => (c.typeIs('isomorphic-lib', 'angular-lib')) && c.frameworkVersionAtLeast('v2'))
      ;

    Helpers.log(`[singularbuild] children for build: \n\n${children.map(c => c.name)}\n\n`);

    const newFactory = ProjectFactory.Instance;
    const tmpWorkspaceName = this.project.name;
    const tmpWorkspaceDirpath = path.join(this.project.location, config.folder.dist);
    const projjjj = path.join(tmpWorkspaceDirpath, tmpWorkspaceName);
    Helpers.log(`dist project: ${projjjj}`);
    this.singularWatchProj = Project.From(projjjj);
    if (!this.singularWatchProj) {
      Helpers.removeFolderIfExists(projjjj);
      this.singularWatchProj = await newFactory.create({
        type: 'isomorphic-lib',
        name: tmpWorkspaceName,
        cwd: tmpWorkspaceDirpath,
        basedOn: void 0,
        version: this.project._frameworkVersion,
        skipInit: true
      });
      Helpers.log(`[singular build] singularWatchProj: ${this.singularWatchProj && this.singularWatchProj.genericName}`);
      // console.log('this.this.project.node_modules.path', this.project.node_modules.path)
      this.project.node_modules.linkToProject(this.singularWatchProj);
    }

    const singularDistSrc = path.join(this.singularWatchProj.location, config.folder.src);
    Helpers.removeFolderIfExists(singularDistSrc);
    Helpers.mkdirp(singularDistSrc);

    Helpers.log(`[singular build] init structure`);

    await this.singularWatchProj.filesStructure.init('');
    Helpers.copyFile(
      path.join(this.project.location, config.file.tnpEnvironment_json),
      path.join(this.singularWatchProj.location, config.file.tnpEnvironment_json)
    );

    this.singularWatchProj.packageJson.data.tnp.isGenerated = true;
    await this.singularWatchProj.packageJson.writeToDisc();

    children.forEach(c => {
      const source = (c.typeIs('angular-lib') ? config.folder.components : config.folder.src);
      Helpers.createSymLink(
        path.join(c.location, source),
        path.join(singularDistSrc, c.name));
    });

    Helpers.info(`[singular build] symlink creation done`);
    Helpers.log(`[singular build] singularWatchProjsingularWatchProj` +
      `${this.singularWatchProj.genericName}, type: $this.{singularWatchProj.type}`);

    await this.singularWatchProj.buildProcess.startForLib({
      watch,
      prod,
      outDir: 'dist',
      staticBuildAllowed: true,
    }, false);
    const targets = children
      .map(c => c.name);

    // if (this.project.isContainer) {
    //   const db = await TnpDB.Instance(config.dbLocation);
    //   var projectsToUpdate = db.getProjects().map(c => c.project as Project)
    //     .filter(c => !c.name.startsWith('tnp'))
    //     .filter(c => !!this.singularWatchProj ? (c.location !== this.singularWatchProj.location) : true)
    //     .filter(c => c.location !== this.project.location)
    //     .filter(c => !c.isWorkspaceChildProject);
    //   Helpers.info(`Statndalone projects to update:` +
    //     `\n\n${projectsToUpdate.map(c => c.genericName).join('\n')}\n\n`);
    //   // process.exit(0)
    // }

    let projectsToUpdate = [];


    children.forEach(c => {
      if (this.project.typeIs('container')) {
        // console.log(`Do something for ${c.genericName}`)
        const source = path.join(this.singularWatchProj.location, config.folder.dist, c.name);
        const sourceBrowser = path.join(this.singularWatchProj.location, config.folder.dist, config.folder.browser, c.name);
        const destBrowser = path.join(this.singularWatchProj.location, config.folder.dist, c.name, config.folder.browser);
        Helpers.remove(destBrowser, true);
        Helpers.createSymLink(sourceBrowser, destBrowser, { continueWhenExistedFolderDoesntExists: true });

        projectsToUpdate.forEach(projForUp => {
          const dest = path.join(projForUp.location, config.folder.node_modules, c.name);
          Helpers.remove(dest, true);
          Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
          console.log(`LINK: ${source} -> ${dest}`, 1);
        });
      } else if (this.project.typeIs('workspace')) {
        const source = path.join(this.singularWatchProj.location, config.folder.dist, c.name);
        const dest = path.join(c.location, config.folder.dist);
        Helpers.remove(dest, true);
        Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });

        targets.forEach(targetName => {
          const sourceBrowser = path.join(
            this.singularWatchProj.location, config.folder.dist,
            `${config.folder.browser}-for-${targetName}`, c.name);

          const destBrowser = path.join(c.location, `${config.folder.browser}-for-${targetName}`);
          Helpers.remove(destBrowser, true);
          Helpers.createSymLink(sourceBrowser, destBrowser, { continueWhenExistedFolderDoesntExists: true });
        });
      }
    });
    if (this.project.isContainer) {
      console.info(`All Projects are linked OK... watching...`)
    }

  }

}
