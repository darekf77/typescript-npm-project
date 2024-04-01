//#region imports
import { path, Helpers, chokidar } from 'tnp-core/src';
import { fse, crossPlatformPath } from 'tnp-core/src';
import { _ } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import cliClassArr from './lib/project/cli/index';

import { BaseStartConfig } from 'tnp-helpers/src';
import { CLASS } from 'typescript-class-helpers/src';
import axios from 'axios';
//#endregion

//#region constants
/**
 * ISSUE larget http request sometime are failing ... but with second try everying is OK
 */
axios.defaults.timeout = 3000;
//#endregion

export async function start(
  argsv: string[],
  frameworkName: 'tnp' | 'firedev' = 'tnp',
  mode: 'dist' | 'npm' = 'dist'
) {
  config.frameworkName = frameworkName;

  Helpers.log(`ins start, mode: "${mode}"`);
  const functionsOrClasses = cliClassArr.map(c => Object.values(c) as Function[]).reduce((a, b) => {
    return a.concat(b.map(funcOrClass => {
      return { classOrFnName: CLASS.getName(funcOrClass), funcOrClass } as any;
    }));
  }, []) as any as { classOrFnName: string; funcOrClass: Function }[];

  new BaseStartConfig({
    ProjectClass: (await import('./lib/project/abstract/project')).Project,
    functionsOrClasses,
    argsv,
    shortArgsReplaceConfig: {
      'app': 'build:app:watch', // should be console menu
      'ba': 'build:app',
      'baw': 'build:app:watch',
      'bw': 'build:watch',
      's': 'start',
      'sw': 'start:watch',
      'ew': 'electron:watch',
      'r': 'release',
      'rmajor': 'release:major',
      'rminor': 'release:minor',
      'r:major': 'release:major',
      'r:minor': 'release:minor',
      // 'ra': 'release:all',
      'ar': 'auto:release',
      'ard': 'auto:release:docs',
      're': 'reinstall',
      '--version': 'version',
      '-v': 'version',
      // open
      'occ': 'open:core:container',
      'ocp': 'open:core:project',
      'o': 'open',
      // test
      'twd': 'test:watch:debug',
      'tdw': 'test:watch:debug',
      'tw': 'test:watch',
      'td': 'test:debug',
      't': 'test',
      // other
      'au': 'autoupdate',
      'up': 'update',
    }
  });

}

export default start;
