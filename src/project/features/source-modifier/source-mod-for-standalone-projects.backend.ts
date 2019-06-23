import { FeatureForProject } from '../../abstract';
import { replace } from './replace';
import config from '../../../config';
import { ModType } from './source-code-type';


export class SourceModForStandaloneProjects extends FeatureForProject {

  protected get foldersSources() {
    return [
      config.folder.components,
      config.folder.src,
    ]
  };

  protected get foldersCompiledJsDtsMap() {
    return [
      config.folder.dist,
      config.folder.bundle,
      config.folder.browser,
      config.folder.module,
    ]
  };

  protected mod3rdPartyLibsReferces(inpput: string, modType: ModType = 'lib') {
    return inpput;
  }

  process(input: string, modType: ModType = 'lib'): string {
    return input;
  }


}
