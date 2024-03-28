import { _, CoreModels } from 'tnp-core/src';
import * as JSON5 from 'json5';
import * as inquirer from 'inquirer';

import { Project } from '../../abstract/project';
import { Models } from '../../../models';
import { Helpers } from 'tnp-helpers/src';
import { CoreLibCategoryArr } from 'tnp-config/src';
import { BaseFeatureForProject } from 'tnp-helpers/src';

export type GetPkgType = { category: CoreModels.CoreLibCategory; version: string; };

export class PackageJsonDepsCoreCategories extends BaseFeatureForProject<Project> {

  protected s_onlyFor = 'onlyFor';
  protected s_common = 'common';
  private get all() {
    return (Project.ins.Tnp).__packageJson.data.tnp.core.dependencies;
  }

  private for(libType: CoreModels.LibType) {
    let result = this.all[this.s_onlyFor][libType];
    _.keys(result).find(key => {
      if (key === '@') {
        result = this.for(result[key] as CoreModels.LibType);
        return true;
      }
      return false;
    });
    return result;
  }

  // private forAsFlat(libType: LibType) {
  //   const result = {};
  //   Object.keys(this.for(libType)).forEach(categoryKey => {
  //     if (_.isObject(this.for(libType)[categoryKey])) {
  //       _.merge(result, this.for(libType)[categoryKey])
  //     } else {
  //       result[categoryKey] = this.for(libType)[categoryKey];
  //     }
  //   });
  //   return result;
  // }

  private get commonForAllLibTypes() {
    return this.all[this.s_common];
  }

  // private get commonForAllLibTypesAsFlat() {
  //   const result = {};
  //   Object.keys(this.commonForAllLibTypes).forEach(categoryKey => {
  //     if (_.isObject(this.commonForAllLibTypes[categoryKey])) {
  //       _.merge(result, this.commonForAllLibTypes[categoryKey]);
  //     } else {
  //       result[categoryKey] = this.commonForAllLibTypes[categoryKey];
  //     }
  //   });
  //   return result;
  // }

  private removeAllWithName(name: string) {

    function rem(deps) {
      if (_.isString(deps[name])) {
        delete deps[name];
      }
      _.keys(deps).forEach(category => {
        if (_.isString(deps[category][name])) {
          delete deps[category][name];
        } else if (_.isObject(deps[category][name])) {
          rem(deps[category][name]);
        }
      });
    }
    rem(this.commonForAllLibTypes);

    CoreLibCategoryArr.forEach(type => {
      const deps = this.for(type as CoreModels.LibType);
      if (deps) {
        rem(deps);
      }
    });
  }

  public getBy(name: string): GetPkgType {

    function cattt(deps, cat: CoreModels.CoreLibCategory): GetPkgType {
      if (_.isString(deps[name])) {
        return { category: cat, version: deps[name] };
      }
      let result: GetPkgType;
      _.keys(deps).find(c => {
        if (_.isString(deps[c][name])) {
          result = { category: `${cat}.${c}` as any, version: deps[c][name] };
          return true;
        } else if (_.isObject(deps[c][name])) {
          result = cattt(deps[c][name], `${cat}.${c}` as any);
          return _.isObject(result);
        }
      });
      return result;
    }
    const fromCommon = cattt(this.commonForAllLibTypes, 'common');
    if (_.isObject(fromCommon)) {
      return fromCommon;
    }

    let result: GetPkgType;
    CoreLibCategoryArr.find(type => {
      const deps = this.for(type as CoreModels.LibType);
      if (deps) {
        result = cattt(deps, type);
        return _.isObject(result);
      }
      return false;
    });
    return result;
  }

  public set(pkg: Models.Package, type: CoreModels.CoreLibCategory) {

    if (!CoreLibCategoryArr.includes(type)) {
      Helpers.error(`[depscorecategories][set] Incrorrect type ${type}`, false, true);
    }
    if (!pkg || !pkg.name || !pkg.version) {
      Helpers.error(`[depscorecategories][set] Incrorrect package ${JSON5.stringify(pkg)}`, false, true);
    }
    this.removeAllWithName(pkg.name);
    if (type === 'common') {
      this.all.common[pkg.name] = pkg.version;
    } else {
      if (!this.all.onlyFor[type]) {
        this.all.onlyFor[type] = {};
      }
      this.all.onlyFor[type][pkg.name] = pkg.version;
    }
  }

}
