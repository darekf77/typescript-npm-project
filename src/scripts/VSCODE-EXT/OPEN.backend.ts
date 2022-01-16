import { _ } from 'tnp-core';
import * as express from 'express';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import { config } from 'tnp-config';
import { Project } from '../../project';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import chalk from 'chalk';
import { RecentFilesForContainer } from '../../project/features/recent-files.backend';



function $OPEN_WORKSPACE() {
  const workspacePath = path.join((Project.Current as Project).location);
  if (!fse.existsSync(workspacePath)) {
    (Project.Current as Project).recreateCodeWorkspace();
  }
  (Project.Current as Project).run(`code ${(Project.Current as Project).location} &`).sync();
  process.exit(0)
}

function $OPEN_WORKSPACE_CHILDS() {
  let proj: Project;
  if ((Project.Current as Project).isWorkspace) {
    proj = Project.Current as Project;
  } else if ((Project.Current as Project).isWorkspaceChildProject) {
    proj = (Project.Current as Project).parent;
  }
  if (proj.isWorkspace) {
    proj.run(`${proj.children.map(c => `code ${c.name}`).join(' && ')}`).sync();
  }
  process.exit(0)
}

function $IS_CORE_PROJECT() {
  Helpers.info(`(${(Project.Current as Project).genericName})
  - is core project: ${chalk.bold(String((Project.Current as Project).isCoreProject))}`)
  process.exit(0)
}


function $OPEN_CORE_CONTAINER() {
  const proj = Project.Current as Project;
  const container = Project.by('container', proj._frameworkVersion);
  if (container) {
    container.run(`code .`).sync();
  } else {
    Helpers.error(`Core container not found...`, false, true);
  }
  process.exit(0)
}

function $OPEN_CORE_PROJECT() {
  if ((Project.Current as Project).isCoreProject && (Project.Current as Project).frameworkVersionAtLeast('v2')) {
    (Project.Current as Project).run(`code ${Project.by<Project>((Project.Current as Project)._type, (Project.Current as Project).frameworkVersionMinusOne).location} &`).sync();
  } else {
    (Project.Current as Project).run(`code ${Project.by<Project>((Project.Current as Project)._type, (Project.Current as Project)._frameworkVersion).location} &`).sync();
  }
  process.exit(0)
}

function $LOCATION() {
  Helpers.info(`

  ${Project.Tnp.location}

  `);
  process.exit(0)
}

function $OPEN_TNP_PROJECT() {
  (Project.Tnp as Project).run(`code ${(Project.Tnp as Project).location} &`).sync();
  process.exit(0)
}

function $OPEN_BASELINE() {
  if ((Project.Current as Project).isSite) {
    if ((Project.Current as Project).isWorkspace) {
      (Project.Current as Project).baseline.run(`code ${(Project.Current as Project).baseline.location} &`).sync();
    } else {
      (Project.Current as Project).baseline.run(`code . &`).sync();
    }
    process.exit(0)
  }
  Helpers.error(`This is not "site project"`, false, true);
}

async function $OPEN(args: string) {
  const db = await TnpDB.Instance();
  if (args.length === 0) {
    Helpers.openFolderInFileExploer(process.cwd());
    process.exit(0)
  }
  const name = _.first(args.split(' '));
  let projects = []
  if (config.coreProjectVersions.includes(name) && Project.Current.isContainer) {
    projects = (Project.Current.children as Project[]).filter(c => c.frameworkVersionAtLeast(name as any));
  } else {
    projects = (await db.getProjects()).filter(p => {
      return ((p.project as Project).name === name) || ((p.project as Project).genericName === name)
    }).map(c => c.project);
  }
  if (projects.length > 0) {
    for (let index = 0; index < projects.length; index++) {
      const p = projects[index];
      Helpers.run(`code ${p.location}`, { biggerBuffer: false }).sync();
    }
    process.exit(0);
  } else {
    Helpers.log(`Projects not found`);
    process.exit(0)
  }

}

async function $RECENT_SAVE_ACTIVE(args) {
  await (Project.Current as Project).recent.saveActiveProjects();
  process.exit(0);
}

const $RECENT_ACTIVE_SAVE = (args) => $RECENT_SAVE_ACTIVE(args)

function $RECENT_SET(args) {
  (Project.Current as Project).recent.setFrom(args);
  process.exit(0);
}


function $OPEN_RECENT() {
  (Project.Current as Project).recent.openRecent();
  process.exit(0);
}

function $CLOSE_RECENT() {

}

function $SET_RECENT(args) {
  $RECENT_SET(args);
}

function $RECENT_OPEN() {
  $OPEN_RECENT();
}

function $RECENT() {
  $OPEN_RECENT();
}

function $RECENT_CLOSE() {
  $CLOSE_RECENT();
}

function $OPEN_NAVI_CLI() {
  Helpers.run(`code ${Project.NaviCliLocation}`, { biggerBuffer: false }).sync();
}

async function $OPEN_UNSTAGE() {
  const proj = (Project.Current as Project);
  const libs = proj.childrenThatAreLibs.filter(f => f.git.thereAreSomeUncommitedChangeExcept([
    config.file.package_json,
    config.file.package_json5,
    config.file.package_json__tnp_json5,
  ]));
  libs.forEach(l => l.openInVscode());
  process.exit(0)
}


export default {
  $LOCATION: Helpers.CLIWRAP($LOCATION, '$LOCATION'),
  $OPEN: Helpers.CLIWRAP($OPEN, '$OPEN'),

  $RECENT_SAVE_ACTIVE: Helpers.CLIWRAP($RECENT_SAVE_ACTIVE, '$RECENT_SAVE_ACTIVE'),
  $RECENT_SET: Helpers.CLIWRAP($RECENT_SET, '$RECENT_SET'),
  $OPEN_RECENT: Helpers.CLIWRAP($OPEN_RECENT, '$OPEN_RECENT'),
  $CLOSE_RECENT: Helpers.CLIWRAP($CLOSE_RECENT, '$CLOSE_RECENT'),
  $RECENT_CLOSE: Helpers.CLIWRAP($RECENT_CLOSE, '$RECENT_CLOSE'),
  $RECENT_OPEN: Helpers.CLIWRAP($RECENT_OPEN, '$RECENT_OPEN'),
  $RECENT: Helpers.CLIWRAP($RECENT, '$RECENT'),
  $RECENT_ACTIVE_SAVE: Helpers.CLIWRAP($RECENT_ACTIVE_SAVE, '$RECENT_ACTIVE_SAVE'),
  $SET_RECENT: Helpers.CLIWRAP($SET_RECENT, '$SET_RECENT'),

  $OPEN_UNSTAGE: Helpers.CLIWRAP($OPEN_UNSTAGE, '$OPEN_UNSTAGE'),
  $OPEN_WORKSPACE_CHILDS: Helpers.CLIWRAP($OPEN_WORKSPACE_CHILDS, '$OPEN_WORKSPACE_CHILDS'),
  $OPEN_WORKSPACE: Helpers.CLIWRAP($OPEN_WORKSPACE, '$OPEN_WORKSPACE'),
  $OPEN_NAVI_CLI: Helpers.CLIWRAP($OPEN_NAVI_CLI, '$OPEN_NAVI_CLI'),
  $IS_CORE_PROJECT: Helpers.CLIWRAP($IS_CORE_PROJECT, '$IS_CORE_PROJECT'),
  $OPEN_CORE_PROJECT: Helpers.CLIWRAP($OPEN_CORE_PROJECT, '$OPEN_CORE_PROJECT'),
  $OPEN_CORE_CONTAINER: Helpers.CLIWRAP($OPEN_CORE_CONTAINER, '$OPEN_CORE_CONTAINER'),
  $OPEN_TNP_PROJECT: Helpers.CLIWRAP($OPEN_TNP_PROJECT, '$OPEN_TNP_PROJECT'),
  $OPEN_BASELINE: Helpers.CLIWRAP($OPEN_BASELINE, '$OPEN_BASELINE'),

}
