import { config, PREFIXES } from "tnp-config/src";
import { path } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { BaseFeatureForProject } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { Models } from "../../models";

export class LinkedRepos extends BaseFeatureForProject<Project> {
  prefixes = {
    DELETED: PREFIXES.DELETED,
    ORIGINAL: PREFIXES.ORIGINAL
  }
  labels = {
    LINKED_REPOS: 'linked-repos'
  }
  get pathLinkedRepos() {
    return path.join(this.project.location, this.labels.LINKED_REPOS);
  }

  get all() {
    const linkedRepos = this.project.__packageJson.linkedRepos
      .map(repo => {
        const { destLinkedRepos } = this.destFor(repo);
        if (this.isDestOk(destLinkedRepos)) {
          return Project.ins.From(destLinkedRepos);
        }
      })
      .filter(f => !!f);
    return linkedRepos as Project[];
  }

  get git() {
    return {
      ignored: () => {
        return `/${this.labels.LINKED_REPOS}`.trimRight() + '\n';
      }
    }
  }

  async update(struct = false) {

    if (this.project.__packageJson.linkedRepos.length > 0 && !struct) {
      const toClone = this.project.__packageJson.linkedRepos;
      for (let index = 0; index < toClone.length; index++) {
        const repo = toClone[index];
        if (repo?.origin) {
          const { destLinkedRepos, nameRepo } = this.destFor(repo);

          if (!Helpers.exists(path.dirname(destLinkedRepos))) {
            Helpers.mkdirp(path.dirname(destLinkedRepos));
          }
          if (this.project.__packageJson.isLink) { // link means temp folder in release
            return;
          }
          try {
            if (this.isDestOk(destLinkedRepos)) {
              if (Helpers.git.checkIfthereAreSomeUncommitedChange(destLinkedRepos)) {
                Helpers.warn(`Ommiting update of linked repo linked-repos/${nameRepo}`.toUpperCase());
                // if (await Helpers.questionYesNo(`Do you want to force reset linked repo linked-repos/${nameRepo}`)) {
                //   Helpers.run('git reset --hard HEAD~5', { cwd: dest }).sync();
                // }
              } else { // TODO
                await Helpers.git.pullCurrentBranch(destLinkedRepos);
              }
            } else {
              await Helpers.git.clone({
                cwd: path.dirname(destLinkedRepos),
                url: repo.origin,
                override: true
              })
            }
          } catch (error) {
            Helpers.error(`Not able to clone/update repo from ${repo.origin}...

              Check your ${config.file.firedev_jsonc}:
              ...
              ${JSON.stringify(repo, null, 4)}
              ...

              `, false, true)
          }

          const toLink = (repo.relativeFoldersLinks || []).filter(f => !(f.from === f.to && f.from === '' && f.from === ''));

          for (let index = 0; index < toLink.length; index++) {
            const element = toLink[index];
            if (element.from && element.to) {
              const fileBasePath = {
                from: path.join(destLinkedRepos, element.from),
                to: path.join(this.project.location, element.to),
              };

              const filter = (filterFile) => {
                return path.basename(filterFile).search(this.prefixes.ORIGINAL) === -1
                  && path.basename(filterFile).search(this.prefixes.DELETED) === -1
              };

              const fileBases = {
                from: Helpers.getRecrusiveFilesFrom(fileBasePath.from).filter(filter),
                to: Helpers.getRecrusiveFilesFrom(fileBasePath.to).filter(filter),
              };

              //#region handl ___ORIGINAL___ files
              // sync from to to new location - create _______UPDATE______.file if new file or ______DELETE______ is file is GONE
              fileBases.from.forEach(sourceFilePath => {
                const destFilePath = sourceFilePath.replace(fileBasePath.from, fileBasePath.to);
                const foundedExistedDestPath = fileBases
                  .to
                  .find(f1 => f1 === destFilePath);


                if (foundedExistedDestPath) {
                  const contentNew = Helpers.readFile(sourceFilePath);
                  const contentExisted = Helpers.readFile(foundedExistedDestPath);
                  const originalFilePath = path.join(
                    path.dirname(foundedExistedDestPath),
                    `${path.basename(foundedExistedDestPath).replace(path.extname(foundedExistedDestPath), '')}`
                    + `${this.prefixes.ORIGINAL}${path.extname(foundedExistedDestPath)}`
                  );
                  if (contentNew && (contentNew !== contentExisted)) {
                    Helpers.writeFile(originalFilePath, contentNew)
                  } else {
                    Helpers.removeFileIfExists(originalFilePath);
                  }
                } else {
                  Helpers.copy(sourceFilePath, destFilePath);
                }
              });
              //#endregion

              //#region handle ___DELETED___ files
              fileBases.to.forEach(sourceFilePath => {

                const destFilePath = sourceFilePath.replace(fileBasePath.to, fileBasePath.from);
                const foundedExistedDestPath = fileBases
                  .from
                  .find(f1 => f1 === destFilePath);

                const deletedFilePath = path.join(
                  path.dirname(sourceFilePath),
                  `${path.basename(sourceFilePath).replace(path.extname(sourceFilePath), '')}`
                  + `${this.prefixes.DELETED}${path.extname(sourceFilePath)}`
                );


                if (foundedExistedDestPath) {
                  Helpers.removeFileIfExists(deletedFilePath);
                } else {
                  Helpers.writeFile(deletedFilePath, '// FILE HAS BEEN DELETED FROM LINKED REPO')
                }
              });
              //#endregion

            }
          }
        }
      }
    }
  }

  private destFor(repo: Models.LinkedRepo) {
    const nameRepo = path.basename(repo.origin.replace('.git', ''));
    const destLinkedRepos = path.join(this.pathLinkedRepos, nameRepo);

    if (!Helpers.exists(path.dirname(destLinkedRepos))) {
      Helpers.mkdirp(path.dirname(destLinkedRepos));
    }
    return {
      destLinkedRepos,
      nameRepo
    }
  }

  private isDestOk(dest: string) {
    return Helpers.exists(dest) && Helpers.git.isInsideGitRepo(dest) && Helpers.git.isGitRoot(dest);
  }




}
