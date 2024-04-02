//#region imports
import { Helpers } from 'tnp-core/src';
import { _ } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import cliClassArr from './lib/project/cli/index';
import { BaseStartConfig } from 'tnp-helpers/src';
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
  new BaseStartConfig({
    ProjectClass: (await import('./lib/project/abstract/project')).Project,
    functionsOrClasses: BaseStartConfig.prepareArgs(cliClassArr),
    argsv,
    shortArgsReplaceConfig: {
      //#region short args replacement
      'app': 'build:app:watch', // should be console menu
      'ba': 'build:app',
      'baw': 'build:app:watch',
      'bw': 'build:watch',
      's': 'build:start',
      'start': 'build:start',
      'ew': 'electron:watch',
      'r': 'release',
      'rmajor': 'release:major',
      'rminor': 'release:minor',
      'r:major': 'release:major',
      'r:minor': 'release:minor',
      // 'ra': 'release:all',
      'ar': 'release:auto',
      'ard': 'release:auto:docs',
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
      //#endregion
    }
  });

}

export default start;
