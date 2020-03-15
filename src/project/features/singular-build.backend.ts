import * as _ from 'lodash';
import * as glob from 'glob';
import * as path from 'path';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import { FeatureForProject, Project } from '../abstract';
import { ProjectFactory } from '../../scripts/NEW-PROJECT_FILES_MODULES/project-factory.backend';
import { config } from '../../config';
import { Helpers } from 'tnp-helpers';


export class SingularBuild extends FeatureForProject {
  get isContainer() {
    return this.project.type === 'container';
  }

  async init(watch: boolean, prod: boolean) {

    const children = this.project.children
      .filter(c => (c.type === 'isomorphic-lib' || c.type === 'angular-lib') && c.frameworkVersion !== 'v1')
      .filter(c => !c.name.startsWith('tnp'))

    const newFactory = ProjectFactory.Instance;
    const tmpWorkspaceName = this.project.name;
    const tmpWorkspaceDirpath = path.join(this.project.location, config.folder.dist);
    const projjjj = path.join(tmpWorkspaceDirpath, tmpWorkspaceName);
    Helpers.log(`dist project: ${projjjj}`);
    let singularWatchProj = Project.From(projjjj);
    if (!singularWatchProj) {
      Helpers.removeFolderIfExists(projjjj);
      singularWatchProj = await newFactory.create(
        'isomorphic-lib',
        tmpWorkspaceName,
        tmpWorkspaceDirpath,
        void 0,
        this.project.frameworkVersion,
        true
      );
      console.log('singularWatchProj', singularWatchProj && singularWatchProj.genericName)
      // console.log('this.this.project.node_modules.path', this.project.node_modules.path)
      this.project.node_modules.linkToProject(singularWatchProj);
    }

    const singularDistSrc = path.join(singularWatchProj.location, config.folder.src);
    Helpers.removeFolderIfExists(singularDistSrc);
    Helpers.mkdirp(singularDistSrc);

    await singularWatchProj.filesStructure.init('');
    Helpers.copyFile(
      path.join(this.project.location, config.file.tnpEnvironment_json),
      path.join(singularWatchProj.location, config.file.tnpEnvironment_json)
    );

    singularWatchProj.packageJson.data.tnp.isGenerated = true;
    await singularWatchProj.packageJson.writeToDisc();

    children.forEach(c => {
      const source = (c.type === 'angular-lib' ? config.folder.components : config.folder.src);
      Helpers.createSymLink(
        path.join(c.location, source),
        path.join(singularDistSrc, c.name));
    });


    await singularWatchProj.buildProcess.startForLib({
      watch,
      prod,
      staticBuildAllowed: true
    }, false);
    const targets = children
      .filter(c => c.type === 'angular-lib')
      .map(c => c.name)

    children.forEach(c => {
      if (this.isContainer) {
        console.log(`Do something for ${c.genericName}`)
      } else if (this.project.type === 'workspace') {
        const source = path.join(singularWatchProj.location, config.folder.dist, c.name);
        const dest = path.join(c.location, config.folder.dist);
        Helpers.remove(dest, true);
        Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });

        targets.forEach(targetName => {
          const sourceBrowser = path.join(
            singularWatchProj.location, config.folder.dist,
            `${config.folder.browser}-for-${targetName}`, c.name);

          const destBrowser = path.join(c.location, `${config.folder.browser}-for-${targetName}`);
          Helpers.remove(destBrowser, true);
          Helpers.createSymLink(sourceBrowser, destBrowser, { continueWhenExistedFolderDoesntExists: true });
        });
      }



    });
  }

}
