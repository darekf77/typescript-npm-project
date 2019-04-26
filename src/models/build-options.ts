
import { Project } from '../project/project';
import { BuildDir } from './build-dir';

export interface IBuildOptions {
  prod: boolean;
  outDir: BuildDir;
  noConsoleClear?: boolean;
  watch?: boolean;
  args?: string;
  compileOnce?: boolean;
  genOnlyClientCode?: boolean;
  onlyBackend?: boolean;
  appBuild?: boolean;
  baseHref?: string;
  onlyWatchNoBuild?: boolean;
  forClient?: Project[] | string[];
  copyto?: Project[] | string[];
  additionalIsomorphicLibs?: string[];
}


