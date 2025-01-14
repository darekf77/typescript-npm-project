import { Helpers, recognizeImportsFromFile } from 'tnp-helpers/src';
import { BaseCommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { path } from 'tnp-core/src';

export class $Ts extends BaseCommandLineFeature<{}, Project> {
  public _() {
    Helpers.clearConsole();
    const importsExports = recognizeImportsFromFile(
      Helpers.readFile(
        path.isAbsolute(this.firstArg)
          ? this.firstArg
          : [this.cwd, this.firstArg],
      ),
    ).map(i => {
      return `${i.embeddedPathToFile} (${i.type})`;
    });
    console.log(importsExports);
    this._exit();
  }
}
export default {
  $Ts: Helpers.CLIWRAP($Ts, '$Ts'),
};
