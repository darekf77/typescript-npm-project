//#region imports / exports
import { _ } from 'tnp-core';
import { path } from 'tnp-core'

import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../abstract/feature-for-project';
import { Project } from '../abstract/project';
import { TnpDB } from 'tnp-db';

export type RecentFilesJson = {
  recentOpenProjects: string[];
}
//#endregion

export class RecentFilesForContainer extends FeatureForProject {
  private constructor(project: Project) {
    super(project)
    this.readConfig();
  }

  //#region template for recent.json file
  private get defaultValue() {
    return {
      recentOpenProjects: []
    } as RecentFilesJson
  }
  //#endregion

  async saveActiveProjects(override = true) {
    if (!this.project.isContainer) {
      Helpers.error(`[tnp-recent-files] Project is not container... `, false, true);
    }
    const db = await TnpDB.Instance();

    // let projects = (await db.getProjects())
    //   .map(p => p.project)
    //   .filter(p => p.typeIsNot(...config.notFiredevProjects));

    const builds = await db.getBuildsBy({
      watch: true,
    });
    const container = this.project;
    const onlyChildren = builds.map(c => c.project as Project).filter(p => p.location.startsWith(container.location));
    this.setFrom(onlyChildren.map(c => {
      return c.location.replace(`${container.location}/`, '');
    }).join(' '), override);
  }

  //#region read config
  private readConfig(): RecentFilesJson {
    if (!this.project.isContainer) {
      return;
    }
    const recentConfigPath = path.join(this.project.location, config.file.tmp_recent_json);
    if (!Helpers.exists(recentConfigPath)) {
      Helpers.writeFile(recentConfigPath, this.defaultValue);
    }
    let configJson: RecentFilesJson;
    try {
      configJson = Helpers.readJson(recentConfigPath, {});
    } catch (error) {
      configJson = this.defaultValue;
    }
    if (!_.isArray(configJson.recentOpenProjects)) {
      configJson.recentOpenProjects = [];
    }
    return configJson;
  }
  //#endregion

  //#region get local recent project
  private get localRecentProjects(): Project[] {
    return this.readConfig()
      .recentOpenProjects
      .map(c => {
        const p = path.join(this.project.location, c);
        const proj = Project.From(p) as Project;
        if (!proj) {
          Helpers.warn(`[recent-projects] no project by path: ${p}`)
        }
        return proj;
      })
      .filter(f => {
        return !!f;
      });
  }
  //#endregion

  //#region open local recent projects
  public openRecent() {
    if (!this.project.isContainer) {
      Helpers.error(`[tnp-recent-files] Project is not container... `, false, true);
    }
    this.localRecentProjects.forEach(p => p.openInVscode());
    Helpers.info('Done')
  }
  //#endregion

  //#region set local recent projects
  public setFrom(args: string, override = true) {
    if (!this.project.isContainer) {
      Helpers.error(`[tnp-recent-files] Project is not container... `, false, true);
    }
    let recentOpenProjects = [];
    if (override) {
      recentOpenProjects = Helpers.cliTool
        .resolveProjectsFromArgs(args, this.project, Project as any)
        .map(c => c.location.replace(`${this.project.location}/`, ''));
    } else {
      recentOpenProjects = Helpers.arrays.uniqArray([
        ...this.localRecentProjects
          .map(c => c.location.replace(`${this.project.location}/`, '')),
        ...Helpers.cliTool
          .resolveProjectsFromArgs(args, this.project, Project as any)
          .map(c => c.location.replace(`${this.project.location}/`, '')),
      ]);
    }

    const recentConfigPath = path.join(this.project.location, config.file.tmp_recent_json);
    Helpers.writeFile(recentConfigPath, {
      recentOpenProjects
    } as RecentFilesJson);
    Helpers.info('Done')
  }
  //#endregion
}
