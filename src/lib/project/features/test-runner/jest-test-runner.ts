//#region @backend
import { _, crossPlatformPath } from 'tnp-core/src';
import { path } from 'tnp-core/src'
import { FeatureForProject } from '../../abstract';
import type { Project } from '../../abstract';
//#endregion

import { config } from 'tnp-config/src';
import { Helpers } from 'tnp-helpers/src';
import type { ProjectIsomorphicLib } from '../../project-specyfic/project-isomorphic-lib';
import { BuildOptions } from 'tnp-db/src';
import { CLASS } from 'typescript-class-helpers/src';
import { Models } from 'tnp-models/src';
import { tempSourceFolder } from '../../../constants';

@CLASS.NAME('JestTestRunner')
export class JestTestRunner
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
    const res = `${useFiles ? `src/tests/**/*${files.length === 1 ? `${_.first(files)}` : `(${files.join('|')})`}${ext}` : 'src/**/*.test.ts'}`
    return res;
  }

  getCWD(args: string,): string {

    const websql: boolean = true;
    const outDir: Models.dev.BuildDir = 'dist';

    const projCwd = crossPlatformPath([
      this.project.location,
      tempSourceFolder(outDir, true, websql),
    ]);

    // console.log(`

    // Testing in: ${projCwd}

    // `)
    return projCwd;
  }

  async start(debug: boolean, args: string) {

    let command: string;

    command = command = `npm-run jest --passWithNoTests`;
    command = Helpers._fixCommand(command);

    Helpers.run(command, { output: true, cwd: this.getCWD(args) }).sync()
    process.exit(0);
  }

  async startAndWatch(debug: boolean, args: string) {

    let command = `npm-run jest --watchAll --passWithNoTests `

    command = Helpers._fixCommand(command);

    Helpers.run(command, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: this.getCWD(args)
    }).async()
    process.stdin.resume();
  }
  //#endregion


}
