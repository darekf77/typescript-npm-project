import { Project } from '../../index';

/**
 * app - angular app
 * - src (angular-lib)
 * lib
 *  - src (isomorphic-lib) -> lib-name/src
 *  - components (angular-lib)   -> lib-name/components
 * tmp-src
 *  - isomorphic-lib
 *  - angular-lib
 *  - site isomorphic-lib
 *  - site angular-lib
 * custom/app
 * custom/lib
 *  - src (isomorphic-lib)
 *  - components (angular-lib)
 */
export type ModType = 'app' | 'lib' | 'custom/app' | 'custom/lib' | 'tmp-src';

export type CheckType = 'standalone' | 'baseline' | 'site';

export type ImpReplaceOptions = {
  debugMatch?: boolean;
  debugNotMatch?: boolean;
  relativePath: string,
  project: Project,
  method: CheckType,
  modType: ModType,
  partsReplacementsOptions?: { replaceWhole?: boolean };
  urlParts: (string | string[])[],
  notAllowedAfterSlash?: (string | string[])[],
  partsReplacements: (string | string[])[],
  name: string;
  input: string,
}
