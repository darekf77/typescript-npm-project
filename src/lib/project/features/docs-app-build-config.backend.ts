import { crossPlatformPath } from 'tnp-core'
import { _ } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../abstract/feature-for-project';


export interface AppBuildConfig {
  build?: boolean;
  prod?: boolean;
  websql?: boolean;
  projName?: string;
  children?: AppBuildConfig[];
}

export class DocsAppBuildConfig extends FeatureForProject {
  get configFileName() {
    return 'docs-app-build-config.json';
  }

  get path() {
    return crossPlatformPath([this.project.location, this.configFileName])
  }


  get config() {
    let cfg = Helpers.readJson(this.path) as AppBuildConfig;
    cfg = this.fix(cfg);
    return cfg;
  }

  private fix(cfg: AppBuildConfig): AppBuildConfig {
    if (!cfg) {
      cfg = {};
    }
    cfg = { build: this.project.isStandaloneProject };
    if (this.project.isStandaloneProject) {
      cfg.projName = this.project.name;
    }
    if (this.project.isSmartContainer) {
      cfg.projName = this.project.smartContainerBuildTarget.name;
    }

    cfg.prod = !!cfg.build;
    cfg.prod = !!cfg.prod;
    cfg.websql = !!cfg.websql;
    cfg.children = cfg.children || [];
    if (this.project.isSmartContainer) {
      const children = this.project.children.map(c => c.name);
      cfg.children = cfg.children.filter(c => children.includes(c.projName));
    }

    for (let index = 0; index < cfg.children.length; index++) {
      cfg.children[index] = this.fix(cfg.children[index]);
    }
    return cfg;
  }

  save(cfg: AppBuildConfig) {
    Helpers.writeJson(this.path, cfg);
  }

}
