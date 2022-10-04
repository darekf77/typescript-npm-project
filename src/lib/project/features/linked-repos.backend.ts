import { config } from "tnp-config";
import { path } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { FeatureForProject } from "../abstract/feature-for-project";
import { Project } from "../abstract/project";


export class LinkedRepos extends FeatureForProject {

  get all() {
    const linkedRepos = this.project.packageJson.linkedRepos
      .map(repo => {
        const { dest } = this.destFor(repo);
        if (this.isDestOk(dest)) {
          return Project.From(dest);
        }
      })
      .filter(f => !!f);
    return linkedRepos as Project[];
  }

  get git() {
    return {
      ignored: () => {
        return `/linked-repos
${this.project.packageJson.linkedRepos
            .map(r => r.relativeFoldersLinks?.map(c => c.to))
            .reduce((a, b) => a.concat(b), [])
            .filter(f => !!f)
            .map(a => `/${a}`).join('\n')
          }`
      }
    }
  }


  async update(struct = false) {
    if (this.project.packageJson.linkedRepos.length > 0 && !struct) {
      const toClone = this.project.packageJson.linkedRepos;
      for (let index = 0; index < toClone.length; index++) {
        const repo = toClone[index];
        if (repo?.origin) {
          const { dest, nameRepo } = this.destFor(repo);
          if (!Helpers.exists(path.dirname(dest))) {
            Helpers.mkdirp(path.dirname(dest));
          }
          try {
            if (this.isDestOk(dest)) {
              if (Helpers.git.checkIfthereAreSomeUncommitedChange(dest)) {
                Helpers.warn(`Ommiting update of linked repo linked-repos/${nameRepo}`.toUpperCase());
                // if (await Helpers.questionYesNo(`Do you want to force reset linked repo linked-repos/${nameRepo}`)) {
                //   Helpers.run('git reset --hard HEAD~5', { cwd: dest }).sync();
                // }
              } else {
                Helpers.git.pullCurrentBranch(dest, true);
              }
            } else {
              Helpers.git.clone({
                cwd: path.dirname(dest),
                url: repo.origin,
                override: true
              })
            }
          } catch (error) {
            Helpers.error(`Not able to clone/update repo from ${repo.origin}...

            Check your ${config.file.package_json__tnp_json5}:
            ...
            ${JSON.stringify(repo, null, 4)}
            ...

            `, false, true)
          }
          const toLink = repo.relativeFoldersLinks.filter(f => !(f.from === f.to && f.from === '' && f.from === ''));
          for (let index = 0; index < toLink.length; index++) {
            const element = toLink[index];
            if (element.from && element.to) {
              try {
                Helpers.createSymLink(
                  path.join(dest, element.from),
                  path.join(this.project.location, element.to),
                )
              } catch (error) {
                Helpers.error(`Not able to link folder for repo from ${repo.origin}...

                Check your ${config.file.package_json__tnp_json5}:
                ...
                ${JSON.stringify(element, null, 4)}
                ...

                `, false, true)
              }

            }
          }
        }
      }
    }
  }

  private destFor(repo: Models.npm.LinkedRepo) {
    const nameRepo = path.basename(repo.origin.replace('.git', ''));
    const destTMP = path.join(this.project.location, 'tmp-linked-repos', nameRepo);
    const dest = path.join(this.project.location, 'linked-repos', nameRepo);
    const destTMPdirname = path.dirname(destTMP);
    const destDirname = path.dirname(dest);
    if (!Helpers.exists(destTMPdirname) || !Helpers.isFolder(destTMPdirname)) {
      Helpers.removeIfExists(destTMPdirname);
      Helpers.mkdirp(destTMPdirname);
    }
    Helpers.remove(destDirname);
    Helpers.createSymLink(destTMPdirname, destDirname);
    return {
      dest,
      nameRepo
    }
  }

  private isDestOk(dest: string) {
    return Helpers.exists(dest) && Helpers.git.isGitRepo(dest) && Helpers.git.isGitRoot(dest);
  }




}
