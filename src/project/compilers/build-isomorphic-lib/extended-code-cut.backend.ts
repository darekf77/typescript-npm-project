import { _ } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'

import { CodeCut, BrowserCodeCut } from 'morphi';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { BrowserCodeCutExtended } from './browser-code-cut.backend';
import { BuildOptions } from 'tnp-db';

export class ExtendedCodeCut extends CodeCut {

  // @ts-ignore
  browserCodeCut: typeof BrowserCodeCutExtended;

  constructor(
    protected cwd: string,
    filesPathes: string[],
    options: Models.dev.ReplaceOptionsExtended,
    /**
     * it may be not available for global, for all compilatoin
     */
    private project: Project,
    private compilationProject: Project,
    private buildOptions: BuildOptions,
    public sourceOutBrowser: string,

  ) {
    super(cwd, filesPathes, options as any);
    this.browserCodeCut = BrowserCodeCutExtended;
  }

  file(absolutePathToFile) {
    return new (this.browserCodeCut)(
      absolutePathToFile,
      this.project,
      this.compilationProject,
      this.buildOptions,
      this.sourceOutBrowser
    ).replaceRegionsForIsomorphicLib(_.cloneDeep(this.options) as any)
      .flatTypescriptImportExport('import')
      .flatTypescriptImportExport('export')
      .replaceRegionsFromTsImportExport('import')
      .replaceRegionsFromTsImportExport('export')
      .replaceRegionsFromJSrequire()
      .saveOrDelete();
  }

}
