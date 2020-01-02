//#region @backend
import chalk from 'chalk';
import * as path from 'path';
import { Helpers } from 'tnp-helpers';
//#endregion

import * as _ from 'lodash';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { config } from '../../../config';

export class BuildOptions implements Models.dev.IBuildOptions {

  public static PropsToOmmitWhenStringify = ['copyto', 'forClient'];
  prod?: boolean;
  outDir?: Models.dev.BuildDir;
  watch?: boolean;
  args?: string;
  progressCallback?: (fractionValue: number) => any;

  noConsoleClear?: boolean;

  /**
   * Do not generate backend code
   */
  genOnlyClientCode?: boolean;
  appBuild?: boolean;
  buildForAllClients?: boolean;
  baseHref?: string;

  /**
   * Generate only backend, without browser version
   */
  onlyBackend?: boolean;


  onlyWatchNoBuild?: boolean;
  copyto?: Models.other.IProject[] | string[];
  copytoAll?: boolean;

  /**
   * For isomorphic-lib
   * Specyify build targets as workspace childs projects names
   */
  forClient?: Models.other.IProject[] | string[];


  //#region @backend
  private static getMainOptions(args: string[]) {
    const ind = args.findIndex((p, i) => (p.endsWith('/tnp') || p === 'tnp')
      && !!args[i + 1] && args[i + 1].startsWith('build'))
    let prod = false, watch = false, outDir = 'dist', appBuild = false;
    if (ind >= 0) {
      const cmd = _.kebabCase(args[ind + 1]).split('-').slice(1)
      const first = _.first(cmd)

      if (first === 'dist' || first === 'bundle') {
        outDir = first;
      }
      if (first === 'app') {
        appBuild = true;
      }
      if (cmd.length >= 2) {
        const second = cmd[1];
        if (second === 'prod') {
          prod = true;
        }
        if (second === 'watch') {
          watch = true;
        }
      }

      if (cmd.length >= 3) {
        const third = cmd[1];
        if (third === 'prod') {
          prod = true;
        }
        if (third === 'watch') {
          watch = true;
        }
      }


    } else {
      return;
    }
    return { prod, watch, outDir, appBuild }
  }

  public static from(argsString: string, projectCurrent: Project,
    mainOptions?: Models.dev.IBuildOptions): BuildOptions {

    const split = argsString.split(' ');
    // console.log('split', split)
    const optionsToMerge = !!mainOptions ? mainOptions : this.getMainOptions(split);
    // console.log('optionsToMerge', optionsToMerge)
    if (!optionsToMerge) {
      return;
    }
    const argsObj: Models.dev.IBuildOptions = require('minimist')(split)
    // console.log('argsObj', argsObj)
    argsObj.watch = optionsToMerge.watch;
    argsObj.prod = optionsToMerge.prod;
    argsObj.outDir = optionsToMerge.outDir as any;
    argsObj.appBuild = optionsToMerge.appBuild;
    argsObj.args = argsString;


    if (argsObj.forClient) {
      if (_.isString(argsObj.forClient)) {
        argsObj.forClient = [argsObj.forClient]
      }
      if (!!projectCurrent && projectCurrent.isWorkspaceChildProject) {
        argsObj.forClient = (argsObj.forClient as string[]).map(projectParentChildName => {
          const proj = projectCurrent.parent.children.find(c => c.name === (projectParentChildName as string)) as Project;
          if (!proj) {
            Helpers.error(`${chalk.bold('--forClient argument')} : Cannot find module ${chalk.bold(projectParentChildName)}`);
          }
          Helpers.info(`Build only for client ${chalk.bold(projectParentChildName)}`)
          return proj;
        }) as any;
      }
    }
    if (!_.isArray(argsObj.forClient)) {
      argsObj.forClient = []
    }

    if (argsObj.copyto) {
      if (_.isString(argsObj.copyto)) {
        argsObj.copyto = [argsObj.copyto]
      }
      argsObj.copyto = (argsObj.copyto as string[])
        .map(argPath => {
          // console.log('argPath', argPath)
          // console.log('raw arg', args)

          // console.log('path', argPath)
          const project = Project.nearestTo(argPath);
          if (!project) {
            Helpers.error(`autobuild.json : Path doesn't contain ${config.frameworkName} type project: ${argPath}`, true, true)
          } else {
            return project;
          }

        }).filter(p => !!p) as any;
    }
    if (!_.isArray(argsObj.copyto)) {
      argsObj.copyto = []
    }

    argsObj.onlyWatchNoBuild = !!argsObj.onlyWatchNoBuild;
    argsObj.genOnlyClientCode = !!argsObj.genOnlyClientCode;

    return _.merge(new BuildOptions(), argsObj) as BuildOptions;
  }

  public static exportToCMD(buildOptions: BuildOptions): string {
    const { appBuild, outDir, watch,
      copyto, baseHref, forClient, prod,
      genOnlyClientCode, onlyBackend, onlyWatchNoBuild
    } = buildOptions;
    const type = appBuild ? 'app' : outDir;
    let args = [];

    if (_.isArray(copyto)) {
      const argsFromCopyto = (copyto as any[]).map(c => {
        let locationOfProject: string;
        if (_.isString(c)) {
          locationOfProject = c;
        } else {
          locationOfProject = c.location;
        }
        return `--copyto ${locationOfProject}`
      });

      args = args.concat(argsFromCopyto)
    }

    if (_.isArray(forClient)) {
      const argsFromForClient = (forClient as any[]).map(c => {
        let project: string;
        if (_.isString(c)) {
          project = c;
        } else {
          project = c.location;
        }
        return `--forClient ${project}`
      })
      args = args.concat(argsFromForClient);
    }

    if (genOnlyClientCode) {
      args.push('--genOnlyClientCode')
    }

    if (onlyBackend) {
      args.push('--onlyBackend')
    }

    if (onlyWatchNoBuild) {
      args.push('--onlyWatchNoBuild')
    }

    if (baseHref) {
      args.push('--baseHref')
    }


    return `tnp build:${type}${watch ? ':watch' : ''}${prod ? ':prod' : ''} ${args.join(' ')}`
  }
  //#endregion

  public toString = () => {
    return JSON.stringify(_.mergeWith({}, _.omit(this, BuildOptions.PropsToOmmitWhenStringify)), null, 4);
  };


}
