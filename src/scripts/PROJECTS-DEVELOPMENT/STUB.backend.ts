import * as _ from 'lodash';
import * as fse from 'fs-extra';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import * as path from 'path';
import * as glob from 'glob';
import { config } from 'tnp-config';
import { TnpDB } from 'tnp-db';
import * as chokidar from 'chokidar';
import { notify } from 'node-notifier';
import { CLASS } from 'typescript-class-helpers';
import chalk from 'chalk';

async function $stub() {
  const proj = Project.Current;
  const regexForClassFunctinoInLine = new RegExp(`[a-zA-Z]+\\(`)
  const regexForFunctinoInLine = new RegExp(`function [a-zA-Z]+\\(`)
  const regexIsExportedConst = new RegExp(`export\\ +const `)
  const files = glob.sync(`${proj.location}/lib/**/*.d.ts`);
  for (let index = 0; index < files.length; index++) {
    const f = files[index];
    console.log(`processing: ${f}`)
    const newFile = f.replace(`.d.ts`, '.ts');
    let mode: 'class' | 'interface' | 'function';
    const newContent = Helpers.readFile(f)
      .split(`\n`)
      .map(l => {

        if (l.search(' class ') !== -1) {
          mode = 'class';
        }
        if (l.search(' interface ') !== -1) {
          mode = 'interface';
        }

        l = l.replace(new RegExp(Helpers.escapeStringForRegEx('declare '), 'g'), ' ');
        if (mode !== 'interface') {
          l = l.replace(new RegExp(Helpers.escapeStringForRegEx('): void;'), 'g'), '):any { }');
        }

        const org = l;
        l = l.trim()

        if (regexIsExportedConst.test(l)) {
          return `// @ts-ignore\n` + l;
        }
        if (regexForFunctinoInLine.test(l)) {
          if (l.endsWith('{')) {
            mode = 'function';
            return org;
          } else {
            const begin = l.match(regexForFunctinoInLine)[0];
            return `export ${begin}any?):any {};`
          }
        }
        if (regexForClassFunctinoInLine.test(l)) {
          if (l.endsWith('{')) {
            return `// @ts-ignore\n` + org;
          } else if (l.endsWith(');')) { // constructor
            return `// @ts-ignore\n` + `${l.replace(/\)\;$/, ') { };')}`
            // } else if (l.endsWith(';')) { // function
            //   return l.replace(/\:.+\;$/, ':any { };')
          } else {
            return `// @ts-ignore\n` + org;
          }
        }
        if(mode === 'function' && l.endsWith(';')) {
          mode = void 0;
          return l.replace(/\;$/,' { return void 0; }');
        }
        return org;
      })
      .join('\n')
    Helpers.writeFile(newFile, newContent);
    Helpers.removeFileIfExists(f);
  }
  proj.run('mv lib src').sync();
  try {
    proj.run('tsc').sync();
  } catch (error) {
  }
  // console.log(files);
  process.exit(0)
}

export default {
  $stub: Helpers.CLIWRAP($stub, '$stub')
}
