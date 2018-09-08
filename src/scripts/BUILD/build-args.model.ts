export interface BuildArgs {
  copyto: string[] | string;
  environmentName: string;
  noConsoleClear: string;
  envName: string;
  onlyWatchNoBuild?: boolean;
  baseHref: string;
  '--base-href': string
}
