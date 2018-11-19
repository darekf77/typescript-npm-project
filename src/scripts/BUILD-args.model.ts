//#region @backend
export interface BuildArgs {
  copyto: string[] | string;
  forClient: string[] | string;
  genOnlyClientCode?: boolean;
  compileOnce?: boolean;
  noConsoleClear: string;
  envName: string;
  onlyWatchNoBuild?: boolean;
  baseHref: string;
  '--base-href': string
}
//#endregion
