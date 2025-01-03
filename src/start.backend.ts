//#region imports
import { Helpers } from 'tnp-core/src';
import { _ } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import cliClassArr from './lib/project/cli/index';
import { BaseStartConfig } from 'tnp-helpers/src';
import type { BaseCommandLine } from 'tnp-helpers/src';
import axios from 'axios';
//#endregion

//#region constants
/**
 * ISSUE largest http request sometime are failing ... but with second try everything is OK
 */
axios.defaults.timeout = 3000;
//#endregion

export async function start(
  argsv: string[],
  frameworkName: 'tnp' | 'taon' = 'tnp',
  mode: 'dist' | 'npm' = 'dist',
) {
  config.frameworkName = frameworkName;

  // Helpers.log(`ins start, mode: "${mode}"`);
  const ProjectClass = (await import('./lib/project/abstract/project')).Project;
  ProjectClass.initialCheck();

  // console.log(argsv);
  if (
    !global.skipCoreCheck &&
    _.isUndefined(argsv.find(a => a.startsWith('startCliService'))) // for workers
  ) {
    // console.log('starting projects workers...');
    await ProjectClass.ins.portsWorker.startDetachedIfNeedsToBeStarted();
    await ProjectClass.ins.taonProjectsWorker.startDetachedIfNeedsToBeStarted();
  }

  new BaseStartConfig({
    ProjectClass: ProjectClass as any,
    functionsOrClasses: BaseStartConfig.prepareArgs(cliClassArr),
    argsv,
    shortArgsReplaceConfig: {
      //#region short args replacement
      il: 'release:install:locally',
      cil: 'release:clear:install:locally',
      'install:locally': 'release:install:locally',
      cinit: 'init:clear:init',
      app: 'build:app:watch', // should be console menu
      ba: 'build:app',
      b: 'build',
      d: 'docs',
      dw: 'docs:watch',
      cb: 'build:clean:build',
      cbuild: 'build:clean:build',
      baw: 'build:app:watch',
      bw: 'build:watch',
      cbw: 'build:clean:watch',
      cbuildwwatch: 'build:clean:watch',
      c: 'clear',
      s: 'build:start',
      start: 'build:start',
      cstart: 'build:start:clean',
      cs: 'build:start:clean',
      mkdocs: 'build:mkdocs',
      ew: 'electron:watch',
      r: 'release',
      lr: 'local:release',
      rmajor: 'release:major',
      rminor: 'release:minor',
      'r:major': 'release:major',
      'r:minor': 'release:minor',
      'set:minor:version': 'release:set:minor:version',
      'set:major:version': 'release:set:major:version',
      'set:minor:ver': 'release:set:minor:version',
      'set:major:ver': 'release:set:major:version',
      'set:framework:ver': 'release:set:framework:version',
      'set:framework:version': 'release:set:framework:version',
      // 'ra': 'release:all',
      e: 'electron',
      ekill: 'electron:kill',
      ar: 'release:auto',
      ard: 'release:auto:docs',
      re: 'reinstall',
      '--version': 'version',
      '-v': 'version',
      // open
      occ: 'open:core:container',
      ocp: 'open:core:project',
      o: 'open',
      or: 'open:release',
      // test
      twd: 'test:watch:debug',
      tdw: 'test:watch:debug',
      tw: 'test:watch',
      td: 'test:debug',
      t: 'test',
      // migrations
      'm': 'migration',
      'mc': 'migration:create',
      'mr': 'migration:run',
      'mrun': 'migration:run',
      'mrw': 'migration:revert',
      'mrev': 'migration:revert',
      'mrevert': 'migration:revert',
      //#endregion
    },
  });
}

export default start;
