
//#region @backend
import { IncrementalCompilation } from 'morphi/build';
import { Project } from './project';
import { compilationWrapperTnp } from '../../helpers';

export abstract class FeatureCompilerForProject extends IncrementalCompilation {

  CompilationWrapper = compilationWrapperTnp;

  constructor(globalPatter: string, location: string, cwd: string, protected project: Project) {
    super(globalPatter, location, cwd);
  }


  protected abstract syncAction(filesPathes: string[]): void;

  protected abstract preAsyncAction(): void;
  protected abstract asyncAction(filePath: string);

}




//#endregion

