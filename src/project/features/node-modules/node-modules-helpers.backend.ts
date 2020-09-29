import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as TerminalProgressBar from 'progress';

import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { FeatureForProject } from '../../abstract';

export function dedupePackages(projectLocation: string, packages?: string[], countOnly = false) {
  let packagesNames = (_.isArray(packages) && packages.length > 0) ? packages :
    (Project.Tnp as Project).packageJson.data.tnp.core.dependencies.dedupe;
  // console.log('(Project.Tnp as Project).packageJson.data.tnp.core.dependencies.dedupe;',(Project.Tnp as Project).packageJson.data.tnp.core.dependencies.dedupe)
  // console.log('packages to dedupe', packagesNames)
  // process.exit(0)

  const rules: { [key: string]: { ommitParents: string[]; onlyFor: string[]; } } = {};

  packagesNames = packagesNames.reduce((a, current, i, arr) => {
    return a.concat([
      ...(Array.isArray(current) ? ((depsArr: string[]) => {
        const first: string = _.first(depsArr);
        depsArr = depsArr.slice(1);
        rules[first] = {
          ommitParents: depsArr
            .filter(f => f.startsWith('\!'))
            .map(f => f.replace(/^\!/, '')),
          onlyFor: depsArr
            .filter(f => !f.startsWith('\!'))
        };
        if (rules[first].onlyFor.length === 0) {
          delete rules[first].onlyFor;
        }
        if (rules[first].ommitParents.length === 0) {
          delete rules[first].ommitParents;
        }

        return [first];
      })(current) : [current])
    ]);
  }, []);

  packagesNames.forEach(f => {
    let organizationProjectSeondPart = '';
    if (f.search('/') !== -1) {
      organizationProjectSeondPart = f.split('/')[1];
      f = _.first(f.split('/'));
    }
    let pathToCurrent = path.join(projectLocation, config.folder.node_modules, f, organizationProjectSeondPart);

    const current = Project.From<Project>(pathToCurrent);

    if (!current) {
      Helpers.warn(`Project with name ${f} not founded`);
      return
    }
    Helpers.log(`Scanning for duplicates of current ${current.name}@${current.version} ....\n`)
    const nodeMod = path.join(projectLocation, config.folder.node_modules);
    if (!fse.existsSync(nodeMod)) {
      Helpers.mkdirp(nodeMod);
    }
    const removeCommand = `find ${config.folder.node_modules}/ -name ${f.replace('@', '\\@')} `;
    // console.log(`removeCommand: ${removeCommand}`)
    const res = Helpers.run(removeCommand, { output: false, cwd: projectLocation }).sync().toString()
    const duplicates = res
      .split('\n')
      .map(l => l.replace(/\/\//g, '/'))
      .filter(l => !!l)
      .filter(l => !l.startsWith(`${config.folder.node_modules}/${f}`))
      .filter(l => !l.startsWith(`${config.folder.node_modules}/${config.folder._bin}`))
      .filter(l => path.basename(path.dirname(l)) === config.folder.node_modules)
    // console.log(duplicates);
    // process.exit(0)
    if (countOnly) {
      duplicates.forEach((duplicateRelativePath, i) => {
        let p = path.join(projectLocation, duplicateRelativePath, organizationProjectSeondPart);
        const nproj = Project.From<Project>(p);
        if (!nproj) {
          // Helpers.warn(`Not able to identyfy project in ${p}`)
        } else {
          p = p.replace(path.join(projectLocation, config.folder.node_modules), '');
          Helpers.log(`${i + 1}. Duplicate "${nproj.name}@${nproj.version}" in:\n\t ${chalk.bold(p)}\n`);
        }
      });
      if (duplicates.length === 0) {
        Helpers.log(`No dupicate of ${current.name} fouded.`);
      }
    } else {
      duplicates.forEach(duplicateRelativePath => {
        const p = path.join(projectLocation, duplicateRelativePath);
        const projRem = Project.From<Project>(p);
        const versionRem = projRem && projRem.version;

        let parentName = path.basename(
          path.dirname(p)
            .replace(new RegExp(`${Helpers.escapeStringForRegEx(config.folder.node_modules)}\/?$`), '')
            .replace(/\/$/, '')
        );



        const org = path.basename(path.dirname(path.dirname(path.dirname(p))));
        if (org.startsWith('\@')) {
          parentName = `${org}/${parentName}`
        }

        if (rules[current.name]) {
          const r = rules[current.name];
          if (_.isArray(r.ommitParents) && (r.ommitParents.includes(parentName) || _.isObject(r.ommitParents.find(o => o.startsWith(parentName.replace('*', '')))))) {
            Helpers.warn(`[excluded] Ommiting duplicate of ${current.name}@${versionRem} inside ${chalk.bold(parentName)}`)
            return
          }
          if (_.isArray(r.onlyFor) && !r.onlyFor.includes(parentName)) {
            Helpers.warn(`[not included] Ommiting duplicate of ${current.name}@${versionRem} inside ${chalk.bold(parentName)}`)
            return
          }
        }

        Helpers.remove(p, true)
        Helpers.info(`Duplicate of ${current.name}@${versionRem} removed from ${chalk.bold(parentName)}`)
      });
    }

  });
}

export function nodeModulesExists(project: Project) {
  if (project.isWorkspace || project.isStandaloneProject) {
    const p = path.join(project.location, config.folder.node_modules, config.folder._bin);
    return fse.existsSync(p) && fse.readdirSync(p).length > 0;
  }
  if (project.isWorkspaceChildProject) {
    if (project.parent.node_modules.exist) {
      project.parent.node_modules.linkToProject(project);
      return true;
    } else {
      return false;
    }
  }
  const p = path.join(project.location, config.folder.node_modules);
  return fse.existsSync(p);
}

export function addDependenceis(project: Project, context: string, allNamesBefore: string[] = []) {
  let newNames = []
  if (!allNamesBefore.includes(project.name)) {
    newNames.push(project.name)
  }

  Models.npm.ArrNpmDependencyType.forEach(depName => {
    newNames = newNames.concat(project.getDepsAsProject(depName, context)
      .filter(d => !allNamesBefore.includes(d.name))
      .map(d => d.name))
  });


  const uniq = {};
  newNames.forEach(name => uniq[name] = name)
  newNames = Object.keys(uniq)


  const projects = newNames
    .map(name => {
      return Project.From<Project>(path.join(context, config.folder.node_modules, name))
    })
    .filter(f => !!f);

  // console.log('projects', projects.length)
  allNamesBefore = allNamesBefore.concat(newNames);

  projects.forEach(dep => {
    allNamesBefore = addDependenceis(dep, context, allNamesBefore)
  });

  return allNamesBefore;
}
