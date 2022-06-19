import { _ } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'

import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { Project } from '../../../abstract';
import { BrowserCodeCutExtended } from '../code-cut';
import { BuildOptions } from 'tnp-db';
import { CodeCut } from '../code-cut';

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
    )
      .REPLACERegionsForIsomorphicLib(_.cloneDeep(this.options) as any)
      .FLATTypescriptImportExport('export')
      .FLATTypescriptImportExport('import')
      .REPLACERegionsFromTsImportExport('export')
      .REPLACERegionsFromTsImportExport('import')
      .REPLACERegionsFromJSrequire()
      .saveOrDelete();
  }

}
