import { BuildDir } from './build-dir';

export interface StartForOptions {
  progressCallback?: (fractionValue: number) => any;
  prod?: boolean;
  watch?: boolean;
  outDir?: BuildDir;
  appBuild?: boolean;
  args?: string;
  staticBuildAllowed?: boolean;
};
