import * as _ from 'lodash';
import * as path from 'path';

import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../abstract/feature-for-project';
import { Project } from '../abstract/project';

export type RecentFilesJson = {
  recentOpenProjects: string[];
}
export class RecentFilesForContainer extends FeatureForProject {

  private static location: { [location: string]: RecentFilesForContainer; }
  public static for(project: Project) {
    if (!project || !project.isContainer) {
      Helpers.error(`[RecentFilesForContainer] this is not container : ${project.location}`, true, false);
    }
    if (!RecentFilesForContainer.location) {
      RecentFilesForContainer.location = {} as any;
    }
    if (!RecentFilesForContainer.location[project.location]) {
      RecentFilesForContainer.location[project.location] = new RecentFilesForContainer(project);
    }
    return RecentFilesForContainer.location[project.location];
  }

  private constructor(project: Project) {
    super(project);
    this.readConfig();
  }

  private get defaultValue() {
    return {
      recentOpenProjects: []
    } as RecentFilesJson
  }

  private readConfig(): RecentFilesJson {
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

  private get recentProjects(): Project[] {
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

  public openRecent() {
    this.recentProjects.forEach(p => p.openInVscode());
    Helpers.info('Done')
  }

  public setRecent(args: string) {
    const recentOpenProjects = Helpers.cliTool
      .resolveProjectsFromArgs(args, this.project, Project as any)
      .map(c => c.location.replace(`${this.project.location}/`, ''))

    const recentConfigPath = path.join(this.project.location, config.file.tmp_recent_json);
    Helpers.writeFile(recentConfigPath, {
      recentOpenProjects
    } as RecentFilesJson);
    Helpers.info('Done')
  }
}
