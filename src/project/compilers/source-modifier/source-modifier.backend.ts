//#region imports
import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { config } from '../../../config';
import { FeatureCompilerForProject, Project } from '../../abstract';
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { ModType, SourceCodeType } from './source-modifier.models';
import { SourceModForWorkspaceChilds } from './source-mod-for-worspace-childs.backend';
import { IncCompiler } from 'incremental-compiler';
//#endregion

const debugFiles = [
  // 'components/index.ts',
];



@IncCompiler.Class({ className: 'SourceModifier' })
export class SourceModifier extends SourceModForWorkspaceChilds {

  @IncCompiler.methods.AsyncAction()
  asyncAction(event: IncCompiler.Change, filePath: string): Promise<any> {

    // console.log('SOurce modifier async !', filePath)
    const f = filePath.replace(this.project.location, '').replace(/^\//, '');
    if (this.project.sourceFilesToIgnore().includes(f)) {
      return;
    }

    // patchingForAsync(filePath, () => {
    SourceModifier.PreventNotUseOfTsSourceFolders(this.project, f, void 0, true);
    // }, 'source-modifier', 3);

  }


  public async asyncActionReplikatorSrc(event, filePath: string) {

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

  public async syncActionReplikatorSrc(filesPathes: string[]) {
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

  get allowedToRunReplikator() {
    // @LAST
    const libs = config.allowedTypes.angularClient.concat(this.project.isSite ? ['isomorphic-lib'] : []);
    return libs.includes(this.project.type);
  }

  async start(taskName?: string, callback?: () => void) {
    if (this.allowedToRunReplikator) {
      // await this.appSourceReplicator.start(`Source Repl: ${taskName}`);
    }
    return await super.start(taskName, callback);
  }

  async startAndWatch(taskName?: string, callback?: any) {
    if (this.allowedToRunReplikator) {
      // await this.appSourceReplicator.startAndWatch(`Source Repl: ${taskName}`);
    }
    return await super.startAndWatch(taskName, callback);
  }

  //#region get source type lib - for libs, app - for clients
  private static getModType(project: Project, relativePath: string): ModType {
    const startFolder: Models.other.SourceFolder = _.first(relativePath.replace(/^\//, '').split('/')) as Models.other.SourceFolder;
    if (/^tmp\-src(?!\-)/.test(startFolder)) {
      return 'tmp-src';
    }
    if (startFolder === 'src') {
      return project.type === 'isomorphic-lib' ? 'lib' : 'app';
    }
    if (project.type === 'angular-lib' && startFolder === 'components') {
      return 'lib';
    }
    if (project.isSite && startFolder === 'custom') {
      return `custom/${this.getModType(project, relativePath.replace(`${startFolder}/`, '') as any)}` as any;
    }
  }
  //#endregion

  //#region fix double apostrophes in imports,export, requires
  private static fixDoubleApostophe(input: string) {
    const regex = /(import|export|require\(|\}\sfrom\s(\"|\')).+(\"|\')/g;
    const matches = input.match(regex);
    if (_.isArray(matches)) {
      matches.forEach(m => {
        input = input.replace(m, m.replace(/\"/g, `'`));
      });
    }
    return input;
  }
  //#endregion

  public static PreventNotUseOfTsSourceFolders(project: Project, relativePath: string, input?: string, asyncCall = false): string {

    relativePath = relativePath.replace(/^\//, '');
    // asyncCall && console.log(`MOD: "${relativePath}"`)
    const debugging = debugFiles.includes(relativePath);
    const saveMode = _.isUndefined(input);

    if (saveMode && !config.fileExtensionsText.includes(path.extname(relativePath))) {
      return;
    }

    const modType = this.getModType(project, relativePath);
    const filePath = path.join(project.location, relativePath);
    if (saveMode) {
      input = fse.readFileSync(filePath, {
        encoding: 'utf8'
      });
    }
    input = this.fixDoubleApostophe(input);
    input = project.sourceModifier.process(input, modType, relativePath);

    if (saveMode) {
      fse.writeFileSync(filePath, input, {
        encoding: 'utf8'
      });
    }
    return input;
  }


  async syncAction(files: string[]) {
    // const files = glob.sync(this.foldersPattern, { cwd: this.project.location });
    // console.log(files)
    files.forEach(f => {
      SourceModifier.PreventNotUseOfTsSourceFolders(this.project, f)
    });
  }

}
