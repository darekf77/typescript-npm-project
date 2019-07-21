import { BuildDir } from './build-dir';
import { BuildOptions } from '../project/features/build-options';

export interface StartForOptions {
  progressCallback?: (fractionValue: number) => any;
  prod?: boolean;
  watch?: boolean;
  outDir?: BuildDir;
  appBuild?: boolean;
  args?: string;
  staticBuildAllowed?: boolean;
};
