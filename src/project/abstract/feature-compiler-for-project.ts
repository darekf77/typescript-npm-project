
//#region @backend
import { IncrementalCompilation } from 'morphi/build';
import { Project } from './project';

export abstract class FeatureCompilerForProject extends IncrementalCompilation {

  constructor(globalPatter: string, location: string, cwd: string, protected project: Project) {
    super(globalPatter, location, cwd);
  }

  protected abstract syncAction(filesPathes: string[]): void;

  protected abstract preAsyncAction(): void;
  protected abstract asyncAction(filePath: string);

}
//#endregion
