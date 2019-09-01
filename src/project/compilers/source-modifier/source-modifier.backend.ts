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
import { SourceModForStandaloneProjects } from './source-mod-for-standalone-projects.backend';
import { SourceModForWorkspaceChilds } from './source-mod-for-worspace-childs.backend';
import { AppSourceReplicator } from './app-source-replicator.backend';
import { IncCompiler } from 'incremental-compiler';
//#endregion

const debugFiles = [
  // 'components/index.ts',
];

export class SourceModifier extends FeatureCompilerForProject {


  get allowedToRunReplikator() {
    const libs = config.allowedTypes.angularClient.concat(this.project.isSite ? ['isomorphic-lib'] : []);
    return libs.includes(this.project.type);
  }

  async init(taskName?: string, callback?: any) {
    if (this.allowedToRunReplikator) {
      await this.appSourceReplicator.start(`Source Repl: ${taskName}`);
    }
    await super.init(taskName, callback);
  }

  async initAndWatch(taskName?: string, callback?: any) {
    if (this.allowedToRunReplikator) {
      await this.appSourceReplicator.startAndWatch(`Source Repl: ${taskName}`);
    }
    await super.initAndWatch(taskName, callback);
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
    input = project.sourceModifier.sourceMod.process(input, modType, relativePath);

    if (saveMode) {
      fse.writeFileSync(filePath, input, {
        encoding: 'utf8'
      });
    }
    return input;
  }

  //#region folder patterns fn
  private get foldersPattern() {
    return getFolderPattern(this.project);
  }
  //#endregion

  //#region constructor
  sourceMod: SourceModForWorkspaceChilds;
  constructor(public project: Project,
    public appSourceReplicator: AppSourceReplicator = IncCompiler
      .getInstance<AppSourceReplicator>('AppSourceReplicator')
  ) {
    super(getFolderPattern(project), '', project && project.location, project);
    this.sourceMod = new SourceModForWorkspaceChilds(project);
    appSourceReplicator.set({
      project
    });
  }
  //#endregion

  //#region SYNC ACTION
  syncAction(): void {
    const files = glob.sync(this.foldersPattern, { cwd: this.project.location });
    // console.log(files)
    files.forEach(f => {
      SourceModifier.PreventNotUseOfTsSourceFolders(this.project, f)
    });
  }
  //#endregion

  //#region PRE ASYNC ACTION
  preAsyncAction(): void {
    // throw new Error("Method not implemented.");
  }
  //#endregion

  //#region ASYNC ACTION
  asyncAction(filePath: string) {

    // console.log('SOurce modifier async !', filePath)
    const f = filePath.replace(this.project.location, '').replace(/^\//, '');
    if (this.project.sourceFilesToIgnore().includes(f)) {
      return;
    }

    // patchingForAsync(filePath, () => {
    SourceModifier.PreventNotUseOfTsSourceFolders(this.project, f, void 0, true);
    // }, 'source-modifier', 3);

  }
  //#endregion

}


function getFolderPattern(project: Project) {
  return `${
    project.isSite ? void 0 :
      `{${[config.folder.src, config.folder.components].join(',')}}`
    }/**/*.ts`
}
