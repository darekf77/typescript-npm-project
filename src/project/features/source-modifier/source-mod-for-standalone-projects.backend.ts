import { FeatureForProject } from '../../abstract';
import { replace } from './replace';
import config from '../../../config';
import { ModType } from './source-code-type';


export abstract class SourceModForStandaloneProjects extends FeatureForProject {

  get foldersSources() {
    return [
      config.folder.components,
      config.folder.src,
    ]
  };

  get foldersCompiledJsDtsMap() {
    return [
      config.folder.dist,
      config.folder.bundle,
      config.folder.browser,
      config.folder.module,
    ]
  };

  mod3rdPartyLibsReferces(inpput: string, modType: ModType = 'lib') {
    return inpput;
  }


}
