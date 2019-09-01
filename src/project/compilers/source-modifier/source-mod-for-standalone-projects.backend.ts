import { FeatureForProject } from '../../abstract';
import { config } from '../../../config';
import { ModType, SourceCodeType } from './source-modifier.models';


export class SourceModForStandaloneProjects extends FeatureForProject {

  protected get foldersSources() {
    return [
      config.folder.components,
      config.folder.src,
    ];
  };

  protected get foldersCompiledJsDtsMap() {
    return [
      config.folder.dist,
      config.folder.bundle,
      config.folder.browser,
      config.folder.module,
    ];
  };

  protected mod3rdPartyLibsReferces(inpput: string, modType: ModType, relativePath: string) {
    return inpput;
  }

  process(input: string, modType: ModType, relativePath: string): string {
    return input;
  }


}
