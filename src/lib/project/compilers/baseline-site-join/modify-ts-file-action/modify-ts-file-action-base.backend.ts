import { Project } from '../../../index';



export abstract class ModifyTsFileActionBase {

  action(relativeBaselineCustomPath: string, input: string): string {
    return input;
  }

}
