//#region @backend
export interface BuildArgs {
  copyto: string[] | string;

  noConsoleClear: string;
  envName: string;
  onlyWatchNoBuild?: boolean;
  baseHref: string;
  '--base-href': string
}
//#endregion
