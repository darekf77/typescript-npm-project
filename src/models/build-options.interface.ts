
import { Project } from '../project';
import { BuildDir } from './build-dir';
import { StartForOptions } from './start-for-options';

export interface IBuildOptions extends StartForOptions {
  noConsoleClear?: boolean;
  genOnlyClientCode?: boolean;
  onlyBackend?: boolean;
  baseHref?: string;
  onlyWatchNoBuild?: boolean;
  forClient?: Project[] | string[];
  copyto?: Project[] | string[];
  additionalIsomorphicLibs?: string[];
}


