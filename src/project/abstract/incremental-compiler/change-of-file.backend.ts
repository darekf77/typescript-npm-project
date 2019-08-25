import * as chokidar from 'chokidar';
import * as path from 'path';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import { CLASS } from 'typescript-class-helpers';

import { BaseClientCompiler } from './base-client-compiler.backend';
import { FileExtension } from '../../../models';
export type ChangeOfFileCloneOptios = {
  onlyForClient?: BaseClientCompiler[];
}


export class ChangeOfFile {

  public clientBy<T = BaseClientCompiler>(fun: Function): T {
    return void 0;
  }
  public clientsForChange: BaseClientCompiler[] = [];
  public clients<C>(clients): { [name in keyof C]: BaseClientCompiler } {
    Object.keys(clients).forEach(key => {
      clients[key] = this.clientBy<C>(clients[key]);
    });
    return void 0;
  };
  public fileAbsolutePath: string;
  public fileExt: FileExtension;
  public readonly datetime: Date;

  clone(options?: ChangeOfFileCloneOptios): ChangeOfFile {
    return void 0;
  }
}
