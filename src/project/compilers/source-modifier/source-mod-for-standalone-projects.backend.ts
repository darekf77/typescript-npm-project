import * as path from 'path';

import { Project } from '../../abstract';
import { config } from '../../../config';
import { ModType, SourceCodeType } from './source-modifier.models';
import { IncCompiler } from 'incremental-compiler';

function optionsSourceModifier(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  let folderPath: string | string[] = void 0;
  if (project.isWorkspaceChildProject) {
    if (project.isSite) {
      if (project.type === 'angular-lib') {
        folderPath = [
          folderPath = path.join(project.location, config.folder.src),
          folderPath = path.join(project.location, config.folder.components),
          folderPath = path.join(project.baseline.location, config.folder.src),
          folderPath = path.join(project.baseline.location, config.folder.components),
        ]
      } else {
        folderPath = path.join(project.location, config.folder.src),
        folderPath = path.join(project.baseline.location, config.folder.src)
      }
    } else {
      if (project.type === 'angular-lib') {
        folderPath = [
          folderPath = path.join(project.location, config.folder.src),
          folderPath = path.join(project.location, config.folder.components),
        ]
      } else {
        folderPath = path.join(project.location, config.folder.src);
      }
    }
  } else if (project.isStandaloneProject) {
    if (project.type === 'angular-lib') {
      folderPath = [
        folderPath = path.join(project.location, config.folder.src),
        folderPath = path.join(project.location, config.folder.components),
      ]
    } else {
      folderPath = path.join(project.location, config.folder.src);
    }
  }
  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath
  };
  console.log(options)
  return options;
}


export class SourceModForStandaloneProjects extends IncCompiler.Base {

  constructor(public project: Project) {
    super(optionsSourceModifier(project));
  }

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
