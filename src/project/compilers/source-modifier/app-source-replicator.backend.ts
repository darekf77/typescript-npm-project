import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { Helpers } from '../../../helpers';
import { config } from '../../../config';
import { Project } from '../../abstract';
import { SourceModifier } from './source-modifier.backend';
import { IncCompiler } from 'incremental-compiler';

@IncCompiler.Class({ className: 'AppSourceReplicator' })
export class AppSourceReplicator
  extends IncCompiler.Base<{ modifiedFilePath: string }, { modifedSyncFilesAbsPthsArr: string[] }> {

  public project: Project;

  set(options: IncCompiler.Models.BaseClientCompilerOptions & { project: Project }) {
    const { project } = options;
    this.project = project;
    options.executeOutsideScenario = false;
    options.folderPath = path.join(project.location, config.folder.src);
    return super.set(options);
  }

  public async syncAction(filesPathes: string[]) {
    Helpers.tryRemoveDir(path.join(this.project.location, config.folder.tempSrc));

    const modifedSyncFilesAbsPthsArr = filesPathes
      .map(f => {
        const orgPath = path.join(this.project.location, f);
        // const orgContent = fse.readFileSync(orgPath, {
        //   encoding: 'utf8'
        // });
        const relativePath = f.replace(/^src/, config.folder.tempSrc)
        const newPath = path.join(this.project.location, relativePath);
        // fse.writeFileSync(newPath, orgContent, {
        //   encoding: 'utf8'
        // });
        Helpers.copyFile(orgPath, newPath);
        if (fse.existsSync(newPath)) {
          SourceModifier.PreventNotUseOfTsSourceFolders(this.project, relativePath)
          return newPath;
        }
      })
      .filter(f => !!f);
    return { modifedSyncFilesAbsPthsArr };
  }

  public async asyncAction(event, filePath: string) {

    const f = filePath.replace(this.project.location, '').replace(/^\//, '');
    if (this.project.sourceFilesToIgnore().includes(f)) {
      return;
    }


    if (fse.existsSync(filePath)) {
      const relative = f.replace(`${this.project.location}/`, '');
      const relativePath = relative.replace(/^src/, config.folder.tempSrc)
      const newPath = path.join(this.project.location, relativePath);
      Helpers.copyFile(f, newPath);
      if (fse.existsSync(newPath)) {
        SourceModifier.PreventNotUseOfTsSourceFolders(this.project, relativePath, void 0, true);
      }
    }
    return void 0;
  }


}
