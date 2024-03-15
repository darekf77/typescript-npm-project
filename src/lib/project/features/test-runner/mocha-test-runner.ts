//#region @backend
import { _ } from 'tnp-core/src';
import { path } from 'tnp-core/src'
import { FeatureForProject } from '../../abstract/feature-for-project';
import { child_process } from 'tnp-core/src';
//#endregion

import { config } from 'tnp-config/src';
import { Helpers } from 'tnp-helpers/src';
import { CLASS } from 'typescript-class-helpers/src';

@CLASS.NAME('MochaTestRunner')
export class MochaTestRunner
  //#region @backend
  extends FeatureForProject
//#endregion
{

  //#region @backend
  fileCommand(files: string[]) {
    files = files.map(f => path.basename(f));
    // console.log('files',files)
    const useFiles = (_.isArray(files) && files.length > 0);
    const ext = (files.length > 1 || (!_.first(files).endsWith('.test.ts'))) ? '*.test.ts' : ''
    const res = `${useFiles
      ? `src/**/tests/**/*${files.length === 1 ? `${_.first(files)}` : `(${files.join('|')})`}${ext}`
      : 'src/**/tests/*.test.ts'}`
    return res;
  }


  async start(files?: string[], debug = false) {

    let command: string;

    command = command = `npm-run mocha  ${debug ? '--inspect' : ''} --require ts-node/register ${this.fileCommand(files)} `
      + ` --timeout ${config.CONST.UNIT_TEST_TIMEOUT} `

    this.project.run(command, { output: true }).sync()
    process.exit(0);
  }

  async startAndWatch(files?: string[], debug = false) {
    if (this.project.typeIsNot('isomorphic-lib')) {
      Helpers.error(`Tests not impolemented for ${this.project.type}`, false, true)
    }

    let command = `npm-run mocha  ${debug ? '--inspect' : ''} --require ts-node/register ${this.fileCommand(files)} `
      + `--watch --watch-files src/tests/**/* --timeout ${config.CONST.UNIT_TEST_TIMEOUT} `

    command = Helpers._fixCommand(command);
    Helpers.run(command, {
      stdio: ['pipe', 'pipe', 'pipe'],
      // env: { ...process.env, FORCE_COLOR: '1' },
      cwd: this.project.location
    }).async()

    process.stdin.resume();
  }
  //#endregion


}
