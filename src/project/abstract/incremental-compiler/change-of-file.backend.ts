import * as chokidar from 'chokidar';
import * as path from 'path';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as fse from 'fs-extra';
import { CLASS } from 'typescript-class-helpers';

import { BaseClientCompiler } from './base-client-compiler.backend';
import { FileExtension } from '../../../models';
export interface ChangeOfFileCloneOptios {
  onlyForClient?: BaseClientCompiler[];
}


export class ChangeOfFile {
  public executedFor: BaseClientCompiler[] = [];
  constructor(
    public readonly clientsForChange: BaseClientCompiler[] = [],
    public readonly fileAbsolutePath: string = void 0,
    public readonly fileExt: FileExtension = void 0) {
    this.datetime = new Date();
  }

  public readonly datetime: Date;

  public clientBy<T = BaseClientCompiler>(fun: Function): T {
    return void 0;
  }

  public clients<C>(clients): { [name in keyof C]: BaseClientCompiler } {
    Object.keys(clients).forEach(key => {
      clients[key] = this.clientBy<C>(clients[key]);
    });
    return void 0;
  }

  clone(options?: ChangeOfFileCloneOptios): ChangeOfFile {
    return void 0;
  }
}
