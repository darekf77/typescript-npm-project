//#region imports
import { crossPlatformPath, _ } from 'tnp-core';
import { fse } from 'tnp-core';
import chalk from 'chalk';
import { Helpers } from 'tnp-helpers';
import { path } from 'tnp-core';
import { config } from 'tnp-config';
import { Models, PROGRESS_DATA } from 'tnp-models';
import { os } from 'tnp-core';
import { FeatureForProject, Project } from '../abstract';
import * as dateformat from 'dateformat';
import { html2md } from './html-to-md';
//#endregion

// const USE_HTTPS_INSTEAD_SSH = !os.hostname().endsWith('.local'); // TODO

export class GitActions extends FeatureForProject {

  //#region before push,pull actions
  private before() {
    if (!this.project.git.isGitRepo) {
      Helpers.error(`Project ${chalk.bold(this.project.name)} is not a git repository
      locaiton: ${this.project.location}`, false, true);
    }
    if (!this.project.git.isGitRoot) {
      Helpers.error(`Project ${chalk.bold(this.project.name)} is not a git root
      locaiton: ${this.project.location}`, false, true);
    }
    if (this.project.git.currentBranchName !== 'master') {
      if (this.project.isContainer || this.project.isWorkspace) {
        if (this.project.git.isGitRepo && this.project.git.isGitRoot) {
          this.project.run(`git checkout -b master && git add --all . && git commit -m "first"`).async();
        }
      } else {
        this.project.run(`code .`).async();
        Helpers.warn(`

        Project: ${this.project.genericName}
        WARNGING default branch is not master...

        `);
        Helpers.pressKeyAndContinue(`press any key to continue or stop the process..`);
      }
    }

    this.project.removeFolderByRelativePath('node_modules/husky');
    if (this.project.targetProjects.exists) {
      Helpers.warn(`

      Don't forget to push target projects for project ${chalk.bold(this.project.name)}

      `);
    }
  }
  //#endregion

  //#region get unexisted projects
  private async cloneUnexistedProjects() {
    const shouldBeProjectArr = this.project.packageJson.linkedProjects
      .map(relativePath => {
        const possibleProjPath = crossPlatformPath(path.join(this.project.location, relativePath))
        let possibleProj = Project.From(possibleProjPath) as Project;
        // console.log({
        //   possibleProjPath,
        //   possibleProj: possibleProj?.name
        // })
        // const possibleProj2 = Project.From(path.join(this.project.location, '--', relativePath));
        if (possibleProj) {
          return void 0;
        }
        if (Helpers.git.isInMergeProcess(possibleProjPath)) {
          Helpers.run('git reset --hard', { cwd: possibleProjPath }).sync();
        }
        possibleProj = Project.From(possibleProjPath) as Project;
        if (possibleProj) {
          return void 0;
        }
        return relativePath;
      })
      .filter(f => !!f)
      .sort()

    if (shouldBeProjectArr.length > 0) {
      Helpers.pressKeyAndContinue(`

${shouldBeProjectArr.map((p, index) => `- ${index + 1}. ${p}`).join('\n')}

      press any key to clone each above project..`);
      for (let index = 0; index < shouldBeProjectArr.length; index++) {
        const relativePath = shouldBeProjectArr[index];
        const projectNameFromPackageJson = path.basename(relativePath);
        if (Helpers.isValidGitRepuUrl(relativePath)) {
          const p = path.join(this.project.location, relativePath);
          if (!Helpers.exists(p)) {
            await Helpers.actionWrapper(() => {
              this.project.git.clone(relativePath);
            }, `Cloning unexisted project from url ${chalk.bold(relativePath)}`);
          }
        } else {
          const ADDRESS_GITHUB_SSH = this.project.git.originURL;
          const githubGitUrl = this.project.isSmartContainer
            ? ADDRESS_GITHUB_SSH.replace(`${this.project.name}.git`, `${this.project.name}--${projectNameFromPackageJson}.git`)
            : ADDRESS_GITHUB_SSH.replace(`${this.project.name}.git`, `${projectNameFromPackageJson}.git`);

          await Helpers.actionWrapper(() => {
            this.project.git.clone(githubGitUrl + ` ${projectNameFromPackageJson}`);
          }, `Cloning unexisted project ${chalk.bold(projectNameFromPackageJson)}`);
        }

      }
    }
  }
  //#endregion

  //#region  get linked projects and childrens
  private async getLinkedPorjectsAndChildrens(action: keyof GitActions, commitMessage?: string): Promise<Project[]> {
    if (this.project.isMonorepo) {
      return [];
    }

    await this.cloneUnexistedProjects();
    let childrenToPush = [
      ...this.project.children.filter(c => {
        return this.project.packageJson.linkedProjects.includes(c.name);
      }),
      ... this.project.linkedProjectsExisted,
    ];

    childrenToPush = childrenToPush.filter(f => !!f);
    return Helpers.arrays.uniqArray<Project>(childrenToPush, 'location') as any;
  }
  //#endregion

  //#region repeat menu push,pull
  private async repeatMenu(action: keyof GitActions, force = false, origin = 'origin') {
    await Helpers.actionWrapper(async () => {
      fixRemote(this.project,
        (this.project.isContainerChild || this.project.isWorkspaceChildProject)
          ? this.project.parent.sshOnly : this.project.sshOnly
      )
      if (action === 'pull') {
        await this.project.git.pullCurrentBranch(true);
      }
      if (action === 'push') {
        ;
        await this.project.git.pushCurrentBranch(force, origin);
      }
    }, `${action.toUpperCase()}ing project ${chalk.bold(this.project.genericName)}...`);
  }
  //#endregion

  //#region pusha all
  public async pushAll(commitMessage?: string, force = false) {
    let remotes: { origin: string; url: string; }[] = [];
    try {
      remotes = (Helpers.run(`git remote -v`, { cwd: process.cwd(), output: false }).sync()?.toString() || '')
        .trim()
        .replace(new RegExp('\\(push\\)', 'g'), ' ')
        .replace(new RegExp('\\t', 'g'), ' ')
        .split('\n')
        .filter(f => f.search('(fetch)') === -1)
        .map(s => {
          const [origin, url] = s.trim().split(' ');
          return {
            origin,
            url
          }
        });
    } catch (error) { }

    Helpers.info(`
Remotes for repo:
${remotes.map((r, i) => `${i + 1}. ${r.origin} ${r.url}`).join('\n')}

    `)

    for (let index = 0; index < remotes.length; index++) {
      const { origin, url } = remotes[index];
      await this.push(commitMessage, force, origin);
    }
    process.exit()
  }
  //#endregion

  async containerChangeLog(proj: Project, children: Project[]) {
    const folderName = `docs`;
    if (!this.project.isContainer || !this.project.generateChangelog) {
      return;
    }
    const withContent = [] as Project[];
    Helpers.actionWrapper(() => {
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        const content = (Helpers.commnadOutputAsString(`diff2html  --output=stdout`, child.location, { showWholeCommandNotOnlyLastLine: true }));
        if (content) {
          withContent.push(child)
          Helpers.writeFile([proj.location, folderName, `${child.name}.html`], content);
        } else {
          Helpers.writeFile([proj.location, folderName, `${child.name}.html`], ' - NOTHING HAS CHANGED - ');
        }
      }
    }, 'generating project changes summary...')


    const filePath = crossPlatformPath([proj.location, folderName, 'index.html'])
    Helpers.writeFile(filePath, (`

LAST PUSH CHANGES ${dateformat(new Date(), 'dd-mm-yyyy HH:MM:ss')}

${withContent.map(c => {
      return `<h2><a href="./${c.name}.html">${c.name}</a></h2>`
    }).join('\n')}

    `));
    return filePath;
  }

  //#region push
  public async push(commitMessage?: string, force = false, origin = 'origin') {
    if (!commitMessage) {
      commitMessage = 'update';
    }
    if (this.project.isContainer) {
      if (!this.project.isSmartContainer) {
        await this.project.filesStructure.init('');
      }
      await this.project.recent.saveActiveProjects(false);
    }
    this.before();
    const linedChildren = await this.getLinkedPorjectsAndChildrens('push')
    const childrenToPush = [
      ...linedChildren,
      ...this.project.linkedRepos.all,
    ];

    await this.containerChangeLog(this.project, this.project.children);

    for (let index = 0; index < childrenToPush.length; index++) {
      const childProj = childrenToPush[index];
      await childProj.gitActions.push(commitMessage, force, origin);
    }



    if ( // TODO QUICK_FIX
      (config.frameworkName === 'tnp')
      && (this.project.name === 'morphi')
    ) {
      config.coreProjectVersions
        .map(v => {
          return { v, c: Project.by('container', v as any) };
        })
        .filter(({ c }) => !!c)
        .forEach(({ v, c }) => {
          (c as Project).packageJson.save('Updating morphi container');
          const morphiEqivalentPath = path.join(this.project.location, 'projects', `container${(v === 'v1') ? '' : `-${v}`}`);
          [
            config.file.package_json,
            config.file.package_json__tnp_json,
          ].forEach(pj => {
            // const pathPjOrg = path.join(c.location, pj);
            const pproj = Project.From(c.location) as Project;
            if (pproj) {
              let currentContent = pproj.packageJson.data;

              if (pj === config.file.package_json__tnp_json) {
                currentContent = pproj.packageJson.data.tnp as any;
              }
              const destPathPj = path.join(morphiEqivalentPath, pj);
              Helpers.writeJson(destPathPj, currentContent);

            }
          });
        });
    }

    if (this.project.git.thereAreSomeUncommitedChange) {
      try {
        this.project.run(`git add --all . && git commit -m "${commitMessage}"`).sync();
      } catch (error) { }
    }
    if (!this.project.git.originURL && this.project.isContainerChild && !this.project.isSmartContainerChild) {
      this.project.run(`git remote add ${origin} ${this.project.parent.git
        .originURL.replace(this.project.parent.name, this.project.name)}`).sync()
    }


    await this.repeatMenu('push', force, origin);
  }
  //#endregion

  //#region pull
  public async pull(clear = false) {
    if (this.project.typeIs('navi')) {
      await this.project.git.pullCurrentBranch(true);
      return;
    }

    this.before();
    if (clear && this.project.npmPackages.useSmartInstall) {
      this.project.node_modules.remove();
    }
    let uncommitedChanges = this.project.git.thereAreSomeUncommitedChange;
    if (uncommitedChanges) {
      Helpers.warn(`Stashing uncommit changes... in ${this.project.genericName}`);
      try {
        this.project.run(`git add --all .`).sync();
      } catch (error) { }
      try {
        this.project.run(`git stash`).sync();
      } catch (error) { }
      try {
        this.project.run(`git reset --hard`).sync();
      } catch (error) { }
      // this.project.run(`code .`).async();
      // Helpers.pressKeyAndContinue(`Commit your changes and press any key...`);
    }

    if (this.project.git.isInMergeProcess) {
      try {
        this.project.run(`git reset --hard`).sync();
      } catch (error) { }
    }

    await this.repeatMenu('pull');
    // if (uncommitedChanges) {
    //   try {
    //     this.project.run(`git stash apply`).sync();
    //   } catch (error) { }
    //   try {
    //     this.project.run(`git reset --hard`).sync();
    //   } catch (error) { }
    // }

    const location = this.project.location;
    Project.unload(this.project);
    this.project = Project.From(location) as Project;

    if (this.project) {
      if (this.project.isContainerOrWorkspaceWithLinkedProjects) {
        const childrenToPull = await this.getLinkedPorjectsAndChildrens('pull');
        for (let index = 0; index < childrenToPull.length; index++) {
          const childProj = childrenToPull[index];
          await childProj.gitActions.pull(clear);
        }
      }
    }

    // if (this.project.isContainer) {
    //   this.project.recent.openRecent();
    // }
  }
  //#endregion

}

//#region fix remote
function fixRemote(project: Project, useSSh = false) {
  const originUrl = project.git.originURL;
  const provider = _.first(originUrl.match(/([a-z0-9]+\.)+(com|org|pl|io)/));// TODO make it more universal
  if (useSSh) {
    if (originUrl.startsWith(`https://${provider}/`)) {
      project.run(`git remote set-url origin ${originUrl.replace(`https://${provider}/`, `git@${provider}:`)}`).sync();
    }
  } else {
    if (originUrl.startsWith(`git@${provider}`)) {
      project.run(`git remote set-url origin ${originUrl.replace(`git@${provider}:`, `https://${provider}/`)}`).sync();
    }
  }

}
//#endregion
