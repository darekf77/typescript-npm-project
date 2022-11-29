//#region @backend
import { _ } from 'tnp-core';
import { path } from 'tnp-core'
import { FeatureForProject } from '../abstract';
import { chokidar } from 'tnp-core';
import { child_process } from 'tnp-core';
//#endregion

import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';

export type TestType = 'unit' | 'integration' | 'e2e';


export class TestRunner
  //#region @backend
  extends FeatureForProject
//#endregion
{

  //#region @backend
  fileCommand(files: string[]) {
    files = files.map(f => path.basename(f));
    // console.log('files',files)
    const useFiles = (_.isArray(files) && files.length > 0);
    const ext = (files.length > 1 || (!_.first(files).endsWith('.spec.ts'))) ? '*.spec.ts' : ''
    const res = `${useFiles ? `src/tests/**/*${files.length === 1 ? `${_.first(files)}` : `(${files.join('|')})`}${ext}` : 'src/**/*.spec.ts'}`
    return res;
  }


  async start(files?: string[], watchMode = false, debugMode = false) {
    let command: string;
    if (this.project.typeIs('isomorphic-lib')) {
      command = `npm-run mocha ${debugMode ? '--inspect' : ''} -r ts-node/register ${this.fileCommand(files)}`
        + ` --timeout ${config.CONST.UNIT_TEST_TIMEOUT}`
    }
    if (!command) {
      Helpers.error(`Tests not impolemented for ${this.project._type}`, false, true)
    }

    Helpers.info(`command: ${command}`)

    try {
      if (watchMode) {
        Helpers.clearConsole()
        Helpers.info(`Start of testing... for watch mode`);
        // Helpers.info(`

        // Running command: ${command}

        // `)
        const result = child_process.execSync(command, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, FORCE_COLOR: '1' },
          cwd: this.project.location
        } as any);
        Helpers.log(result.toString());
      } else {
        Helpers.info(`Start of testing...`);
        this.project.run(command, { output: true }).sync()
        Helpers.info(`End of testing...`);
      }
    } catch (err) {
      Helpers.log(err)
      let errorMessage = err?.output[2]?.toString();
      let errorMessage2 = err?.output[1]?.toString();
      // Helpers.error(errorMessage, true, false);
      // Helpers.error(errorMessage2, true, false);
      errorMessage = (errorMessage || '')
      errorMessage = errorMessage.replace(_.first(errorMessage.split('TSError:')), '');

      if (!errorMessage && !errorMessage2 && err.message) {
        let first = _.first((err.message as string).split('\n'))
        Helpers.error(first, true, true);
      } else {
        Helpers.error(remoteAtFromCallStack(errorMessage), true, true);
        Helpers.error(remoteAtFromCallStack(errorMessage2), true, true);
      }
      Helpers.error(`Error during testing files *${this.fileCommand(files)}*`, true, true);
      //       Helpers.pressKeyAndContinue(`

      // Fix your code and press any key...

      //       `)
    }
  }

  async startAndWatch(files?: string[], debug = false) {
    if (this.project.typeIsNot('isomorphic-lib')) {
      Helpers.error(`Tests not impolemented for ${this.project._type}`, false, true)
    }

    const execture = _.debounce(async () => {
      await this.start(files, true, debug);
    }, 500, {
      // leading: true
    });
    const pathToWatch = `${this.project.path('src').absolute.normal}/**/*.ts`;
    chokidar.watch([
      pathToWatch,
    ]).on('all', async () => {
      // console.log('EVENT!')
      // await this.start(files, true);
      execture()
    });
    process.stdin.resume();
  }
  //#endregion


}

//#region @backend
function remoteAtFromCallStack(s) {
  // let oneExPass = false;
  return s.split('\n').map(l => {
    // if (l.trim().startsWith('at ')) { // TODO hmmm i think I don't need this.. long call stack ok when no fail
    //   if (oneExPass) {
    //     return void 0;
    //   } else {
    //     oneExPass = true;
    //   }
    // }
    return l;
  }).filter(l => !_.isUndefined(l)).join('\n').trim();
}

//#endregion
