import { _ } from 'tnp-core';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import chalk from 'chalk';
import { os } from 'tnp-core';
import { config } from 'tnp-config';
import { Project } from '../abstract';
import { FeatureCompilerForProject } from '../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { FeatureForProject } from '../abstract';
import { CLASS } from 'typescript-class-helpers';
import type { IncrementalBuildProcess } from '../compilers/build-isomorphic-lib/compilations/incremental-build-process.backend';


const compierEntityKey = 'compilers';

const COMPILER_CACHE_ENABLE = false

export class CompilerCache extends FeatureForProject {


  get isWatchModeAllowed() {
    return Promise.resolve(false); // TODO
    // return CompilerCache.checkIfPojectHasUpToDateCompiledData(this.project);
  }

  async unsetData() {
    await CompilerCache.unsetProjectHasUpToDateCompiledData(this.project)
  }

  get setUpdatoDate() {
    return {
      frameworkFileGenerator: async () => {
        await CompilerCache.setProjectHasUpToDateCompiledData(this.project, this.project.frameworkFileGenerator);
      },
      sourceModifier: async () => {
        await CompilerCache.setProjectHasUpToDateCompiledData(this.project, this.project.sourceModifier);
      },
      join: async () => {
        await CompilerCache.setProjectHasUpToDateCompiledData(this.project, this.project.join);
      },
      incrementalBuildProcess: async () => {
        // TODO
        // await CompilerCache.setProjectHasUpToDateCompiledData(this.project, this.project.incrementalBuildProcess as any);
      },
    }
  }

  // tslint:disable-next-line: member-ordering
  public static async checkIfPojectHasUpToDateCompiledData(project: Project) {
    if (!COMPILER_CACHE_ENABLE) {
      return;
    }
    const projectLocation = project.location;
    const db = await TnpDB.Instance();
    let data = await db.rawGet(compierEntityKey) as any[];
    if (!_.isArray(data)) {
      return false;
    }
    const existed = data.find(d => d.project === projectLocation);
    if (!existed || !existed.compilersUpToDate) {
      return false;
    }
    /*
    - source modifier (angular-lib,isomorphi-lib)
    - incremental build process (angular-lib,isomorphi-lib)
    - framwerork files generator (isomorphi-lib)
    - baseline site join (angular-lib,isomorphi-lib)

    */
    if (project.typeIs('angular-lib')) {
      return Object
        .keys(existed.compilersUpToDate)
        .filter(f => !!existed.compilersUpToDate[f])
        .length === (project.isSite ? 3 : 2);
    }
    if (project.typeIs('isomorphic-lib')) {
      return Object
        .keys(existed.compilersUpToDate)
        .filter(f => !!existed.compilersUpToDate[f])
        .length === (project.isSite ? 4 : 3);
    }
    return false;
  }

  // tslint:disable-next-line: member-ordering
  public static async setProjectHasUpToDateCompiledData(project: Project,
    compilerObject: FeatureCompilerForProject | IncrementalBuildProcess) {
    if (!COMPILER_CACHE_ENABLE) {
      return;
    }
    const compilerName = CLASS.getNameFromObject(compilerObject);
    const projectLocation = project.location;
    Helpers.log(`



    SET VALID ${compilerName} FOR ${chalk.bold(project.name)}



    `);
    const db = await TnpDB.Instance();
    let data = await db.rawGet(compierEntityKey) as any[];
    Helpers.log(`

    RAW: ${data && JSON.stringify(data)}

    `, 1)
    if (!_.isArray(data)) {
      data = [];
    }
    const existed = data.find(d => d.project === projectLocation);
    if (existed) {
      existed.compilersUpToDate[compilerName] = true;
    } else {
      const obj = {
        project: projectLocation,
        compilersUpToDate: {},
      };
      obj.compilersUpToDate[compilerName] = true;
      data.push(obj);
    }
    await db.rawSet(compierEntityKey, data);
  }
  public static async unsetAllProjectsCompiledData() {
    if (!COMPILER_CACHE_ENABLE) {
      return;
    }
    const db = await TnpDB.Instance();
    await db.rawSet(compierEntityKey, []);
  }
  public static async unsetProjectHasUpToDateCompiledData(project: Project) {
    if (!COMPILER_CACHE_ENABLE) {
      return;
    }
    const projectLocation = project.location;
    Helpers.log(`



    UNSET VALID ALL COMPILERS FOR ${chalk.bold(project.name)}



    `);
    const db = await TnpDB.Instance();
    let data = await db.rawGet(compierEntityKey) as any[];
    Helpers.log(`

    RAW: ${data && JSON.stringify(data)}

    `, 1)
    if (!_.isArray(data)) {
      data = [];
    }
    const existed = data.find(d => d.project === projectLocation);
    if (existed) {
      existed.compilersUpToDate = {};
    } else {
      const obj = {
        project: projectLocation,
        compilersUpToDate: {},
      };
      data.push(obj);
    }
    await db.rawSet(compierEntityKey, data);
  }


}
