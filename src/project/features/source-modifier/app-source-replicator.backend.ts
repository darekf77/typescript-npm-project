import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import { error, escapeStringForRegEx, log, warn, copyFile, tryRemoveDir } from '../../../helpers';

import config from '../../../config';

import { FeatureForProject, FeatureCompilerForProject, Project } from '../../abstract';
import { SourceModifier } from './source-modifier.backend';

export class AppSourceReplicator extends FeatureCompilerForProject {


  constructor(public project: Project) {
    super(`src/**/*.*`, '', project && project.location, project);
  }


  public syncAction(filesPathes: string[]): void {
    tryRemoveDir(path.join(this.project.location, config.folder.tempSrc));
    const files = glob
      .sync(this.globPattern, { cwd: this.project.location })
      .forEach(f => {
        const orgPath = path.join(this.project.location, f);
        // const orgContent = fse.readFileSync(orgPath, {
        //   encoding: 'utf8'
        // });
        const relativePath = f.replace(/^src/, config.folder.tempSrc)
        const newPath = path.join(this.project.location, relativePath);
        // fse.writeFileSync(newPath, orgContent, {
        //   encoding: 'utf8'
        // });
        copyFile(orgPath, newPath);
        if (fse.existsSync(newPath)) {
          SourceModifier.PreventNotUseOfTsSourceFolders(this.project, relativePath)
        }
      });
    // console.log(files);
    // throw new Error("Method not implemented.");
  }
  public preAsyncAction(): void {
    // throw new Error("Method not implemented.");
  }

  public lastChangedAsyncFileS: string[] = [];
  public asyncAction(filePath: string) {
    // throw new Error("Method not implemented.");
    const that = this;

    const f = filePath.replace(this.project.location, '').replace(/^\//, '');
    if (this.project.sourceFilesToIgnore().includes(f)) {
      return;
    }
    if (this.lastChangedAsyncFileS.includes(filePath)) {
      // console.log('dont perform action on ', filePath)
      return;
    }

    if (fse.existsSync(filePath)) {
      this.lastChangedAsyncFileS.push(filePath);
      const relative = f.replace(`${this.project.location}/`, '');
      const relativePath = relative.replace(/^src/, config.folder.tempSrc)
      const newPath = path.join(this.project.location, relativePath);
      copyFile(f, newPath);
      if (fse.existsSync(newPath)) {
        SourceModifier.PreventNotUseOfTsSourceFolders(this.project, relativePath, void 0, true);
      }
      log(`[replikator async] fixed: ${relativePath}`);

      ((filePathAA) => {
        setTimeout(() => {
          that.lastChangedAsyncFileS = that.lastChangedAsyncFileS.filter(fileAlread => fileAlread !== filePathAA);
        }, 1000);
      })(filePath);
    }


  }


}
