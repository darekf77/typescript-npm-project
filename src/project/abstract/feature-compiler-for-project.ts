
//#region @backend
import { IncrementalCompilation } from 'morphi/build';
import { Project } from './project';
import { Helpers } from '../../helpers';

export abstract class FeatureCompilerForProject extends IncrementalCompilation {

  CompilationWrapper = Helpers.compilationWrapperTnp as any;

  constructor(globalPatter: string, location: string, cwd: string, protected project: Project) {
    super(globalPatter, location, cwd);
  }


  public abstract syncAction(filesPathes: string[]): void;

  public abstract preAsyncAction(): void;
  public abstract asyncAction(filePath: string);

}




//#endregion

