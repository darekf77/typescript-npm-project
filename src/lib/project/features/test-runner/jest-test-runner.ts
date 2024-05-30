//#region @backend
import { _, crossPlatformPath } from 'tnp-core/src';
import { path } from 'tnp-core/src';
import { BaseFeatureForProject } from 'tnp-helpers/src';
//#endregion

import { Helpers } from 'tnp-helpers/src';
import { tempSourceFolder } from '../../../constants';
import { Project } from '../../abstract/project';

export class JestTestRunner
  //#region @backend
  extends BaseFeatureForProject<Project>
{
  //#endregion
  //#region @backend
  fileCommand(files: string[]) {
    files = files.map(f => path.basename(f));
    // console.log('files',files)
    const useFiles = _.isArray(files) && files.length > 0;
    const ext =
      files.length > 1 || !_.first(files).endsWith('.test.ts')
        ? '*.test.ts'
        : '';
    const res = `${useFiles ? `src/tests/**/*${files.length === 1 ? `${_.first(files)}` : `(${files.join('|')})`}${ext}` : 'src/**/*.test.ts'}`;
    return res;
  }

  getCWD(args: string): string {
    const websql: boolean = true;
    const outDir: 'dist' = 'dist';

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

    Helpers.run(command, { output: true, cwd: this.getCWD(args) }).sync();
  }

  async startAndWatch(debug: boolean, args: string) {
    let command = `npm-run jest --watchAll --passWithNoTests `;

    command = Helpers._fixCommand(command);

    Helpers.run(command, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: this.getCWD(args),
    }).async();
  }
  //#endregion
}
