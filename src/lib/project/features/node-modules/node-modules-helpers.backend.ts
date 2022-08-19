import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import { _ } from 'tnp-core';
import { CLI } from 'tnp-cli';
import { glob } from 'tnp-core';

import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';

//#region dedupe packages
export function dedupePackages(projectLocation: string, packagesNames?: string[], countOnly = false, warnings = true) {

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
      warnings && Helpers.log(`Project with name ${f} not founded`);
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
          Helpers.log(`${i + 1}. Duplicate "${nproj.name}@${nproj.version}" in:\n\t ${CLI.chalk.bold(p)}\n`);
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
        if (org.startsWith('\@') || org.startsWith('@')) {
          parentName = `${org}/${parentName}`
        }

        const parentLabel = parentName ? `${parentName}/` : ''; // TODO not working !

        if (rules[current.name]) {
          const r = rules[current.name];
          if (_.isArray(r.ommitParents) && (r.ommitParents.includes(parentName)
            || _.isObject(r.ommitParents.find(o => o.startsWith(parentName.replace('*', '')))))) {
            Helpers.warn(`[excluded] Ommiting duplicate of `
              + `${parentLabel}${current.name}@${versionRem} inside ${CLI.chalk.bold(parentName)}`)
            return
          }
          if (_.isArray(r.onlyFor) && !r.onlyFor.includes(parentName)) {
            Helpers.warn(`[not included] Ommiting duplicate of `
              + `${parentLabel}${current.name}@${versionRem} inside ${CLI.chalk.bold(parentName)}`)
            return
          }
        }

        Helpers.remove(p, true)
        Helpers.warn(`Duplicate of ${parentLabel}${current.name}@${versionRem}`
          + ` removed from ${CLI.chalk.bold(parentName)}`)
      });
    }

  });
}
//#endregion

//#region node module exists

function nodeMOdulesOK(pathToFolder: string | string[], moreThan = 1) {
  if (_.isArray(pathToFolder)) {
    pathToFolder = path.join(...pathToFolder) as string;
  }
  let res = false;
  Helpers.log(`[node-modules] checking if exists in: ${pathToFolder}`)
  if (Helpers.exists(pathToFolder)) {
    const count = {
      unknowFilesOrUnexitedLInks: 0,
      folders: 0,
      links: 0
    };
    res = !_.isUndefined(fse.readdirSync(pathToFolder)
      .map(f => path.join(pathToFolder as string, f))
      .find(f => {
        if (count.unknowFilesOrUnexitedLInks > moreThan) {
          return true;
        }
        if (count.folders > moreThan) {
          return true;
        }
        if (count.links > moreThan) {
          return true;
        }
        if (Helpers.isExistedSymlink(f)) {
          count.links++;
        } else if (Helpers.isFolder(f)) {
          count.folders++;
        } else {
          count.unknowFilesOrUnexitedLInks++;
        }
        return false;
      })
    );
  }
  Helpers.log(`[node-modules] checking done: ${res}`)
  return res;
}

export function nodeModulesExists(project: Project) {
  if (project.isWorkspace || project.isStandaloneProject) {

    const nodeModulesPath = path.join(project.location, config.folder.node_modules);

    const pathBin = path.join(nodeModulesPath, config.folder._bin);
    const dummyPackages = config.quickFixes.missingLibs.length + 1;
    const fullOfPackages = nodeMOdulesOK(nodeModulesPath, dummyPackages);
    const res = Helpers.exists(pathBin) && fullOfPackages;
    return res;
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

export function nodeModulesHasOnlyLinks(project: Project) {
  const links = Helpers.linksToFolderFrom(project.node_modules.path);
  return links.length > 500; // TODO QUICK_FIX
}

//#endregion

//#region add dependencies
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
//#endregion

//#region stuberize frontend package for backedn
const regexForClassFunctinoInLine = new RegExp(`[a-zA-Z]+\\(`)
const regexForClassStaticFunctinoInLine = new RegExp(`static\ +[a-zA-Z]+\\(`)
const regexForFunctinoInLine = new RegExp(`function [a-zA-Z]+\\(`)
const regexForGenericFunctinoInLine = new RegExp(`function [a-zA-Z]+\\<`)
const regexIsExportedConst = new RegExp(`export\\ +const `)
const specialFunctionEnd = `//<replace>`;
const notAllowedFolderToCopy = [
  'browser',
  'bundles',
  'esm5',
  'esm2015',
  'fesm5',
  'fesm2015',
  'dist',
  'bundle'
];

function fixPackageJson(pathToPacakgeJson: string, project: Project) {
  const file = Helpers.readJson(pathToPacakgeJson) as Models.npm.IPackageJSON;
  const newFile = _.pick(file, [
    'name',
    'version',
    'tnp',
    'dependencies',
    'devDependencies',
    'license',
    'bin',
  ] as (keyof Models.npm.IPackageJSON)[]);
  newFile.tnp = {
    version: project._frameworkVersion,
    type: 'angular-lib',
  } as any;
  Helpers.writeFile(pathToPacakgeJson, newFile);
}



function createSubVersion(proj: Project, symlinkFolderFromSrcToRcreate: string[]) {
  const projLocation = (proj.location);
  const newStuberizedName = `${path.basename(projLocation)}${config.SUBERIZED_PREFIX}`;
  const newProjStubLocaiton = path.join(
    path.dirname(projLocation),
    newStuberizedName
  );
  const filesAndFolderToCopy = fse
    .readdirSync(projLocation)
    .filter(f => ![
      config.folder.browser,
      config.folder._browser,
    ].includes(f))

  Helpers.removeFolderIfExists(newProjStubLocaiton);
  filesAndFolderToCopy.forEach(fileOrFolderName => {
    const source = path.join(projLocation, fileOrFolderName);
    const dest = path.join(newProjStubLocaiton, fileOrFolderName);
    if (Helpers.isFolder(source)) {
      Helpers.copy(source, dest);
    } else {
      Helpers.copyFile(source, dest);
    }
  });

  symlinkFolderFromSrcToRcreate.forEach(folderLinkName => {
    const source = path.join(newProjStubLocaiton, config.folder.dist, folderLinkName);
    const dest = path.join(newProjStubLocaiton, folderLinkName);
    Helpers.createSymLink(source, dest);
  })

  Helpers.removeExcept(projLocation, [
    config.folder._browser,
    config.folder.browser,
  ]);

  fse.readdirSync(path.join(projLocation, config.folder.browser))
    .forEach(fileOrFolderName => {
      const source = path.join(path.join(projLocation, config.folder.browser, fileOrFolderName));
      const dest = path.join(path.join(projLocation, fileOrFolderName));
      Helpers.removeIfExists(dest);
      if (Helpers.isFolder(source)) {
        Helpers.copy(source, dest);
      } else {
        Helpers.copyFile(source, dest);
      }
    });
  Helpers.removeFolderIfExists(path.join(projLocation, config.folder.browser));
}


export function stuberizeFrontendPackages(project: Project, packages?: string[]) {
  const tnp = Project.Tnp as Project;
  let packagesNames = (_.isArray(packages) && packages.length > 0) ? packages :
    tnp.packageJson.data.tnp.core.dependencies.stubForBackend;

  project.quickFixes.badTypesInNodeModules();

  Helpers.info(`Suberization of packages: \n${packagesNames.map(p => `- ${p}`).join(',\n')}\n\n`)

  for (let index = 0; index < packagesNames.length; index++) {
    const packageName = packagesNames[index];
    Helpers.info(`[tnp][node_modueles] Stuberization of package ${CLI.chalk.bold(packageName)}`);

    const packageJsonPath = path.join(project.node_modules.path, packageName, config.file.package_json);
    const packageJsonInBrowser = path.join(project.node_modules.path, packageName, config.folder._browser, config.file.package_json);

    if (!Helpers.exists(packageJsonPath) && Helpers.exists(packageJsonInBrowser)) {
      Helpers.copyFile(packageJsonInBrowser, packageJsonPath);
    }

    fixPackageJson(packageJsonPath, project);

    const proj = Project.From(path.join(project.node_modules.path, packageName)) as Project;
    // Helpers.run(`cp -r ${proj.location}`)

    const orginalBrowserPackage = path.join(proj.location, config.folder._browser);
    const browserDataLocation = path.join(proj.location, config.folder.browser);

    if (Helpers.exists(orginalBrowserPackage)) {
      Helpers.removeExcept(proj.location, [
        config.folder._browser,
        config.file.package_json,
      ]);
    }

    if (!Helpers.exists(orginalBrowserPackage) && Helpers.exists(browserDataLocation)) {
      Helpers.copy(browserDataLocation, orginalBrowserPackage);
    }

    if (!Helpers.exists(orginalBrowserPackage)) {
      Helpers.copy(proj.location, orginalBrowserPackage, { useTempFolder: true });
    }


    Helpers.removeFolderIfExists(browserDataLocation);
    Helpers.copy(orginalBrowserPackage, browserDataLocation);
    Helpers.removeExcept(proj.location, [
      config.folder.browser,
      config.folder._browser,
      config.file.package_json,
    ]);


    const browserFolders = fse
      .readdirSync(path.join(proj.location, config.folder.browser))
      .filter(f => {
        const fileOrFoler = path.join(proj.location, config.folder.browser, f);
        return fse.lstatSync(fileOrFoler).isDirectory();
      })
      .filter(folderName => !notAllowedFolderToCopy.includes(folderName));

    browserFolders.forEach(folderName => {
      const source = path.join(proj.location, config.folder.browser, folderName);
      const dest = path.join(proj.location, config.folder.src, folderName);
      Helpers.removeFolderIfExists(dest);
      Helpers.copy(source, dest);
    })

    const mainPublicApi = path.join(proj.location, config.folder.browser, config.file.publicApi_d_ts);

    if (Helpers.exists(mainPublicApi)) {
      Helpers.copyFile(
        mainPublicApi,
        path.join(proj.location, config.folder.src, config.file.index_d_ts),
      );
    }

    const files = glob.sync(`${proj.location}/src/**/*.d.ts`);
    // console.log(files);
    // process.exit(0)
    for (let index = 0; index < files.length; index++) {
      const f = files[index];
      // console.log(`processing: ${f}`)
      const newFile = f.replace(`.d.ts`, '.ts');
      let mode: 'class' | 'interface' | 'function';
      const rawContent = Helpers.readFile(f);
      const splitLength = rawContent.split(`\n`);
      let newContent = splitLength
        .map((l, i) => {

          if (l.search(' class ') !== -1) {
            mode = 'class';
          }
          if (l.search(' interface ') !== -1) {
            mode = 'interface';
          }

          l = l.replace(new RegExp(Helpers.escapeStringForRegEx('declare '), 'g'), ' ');
          if (mode !== 'interface') {
            l = l.replace(new RegExp(Helpers.escapeStringForRegEx('): void;'), 'g'), '):any { }');
          }

          const org = l;
          l = l.trim()

          if (regexIsExportedConst.test(l)) {
            const res = `// @ts-ignore\n${l}`;
            if (mode === 'function') {
              mode = void 0;
              return `${specialFunctionEnd}\n${res}`;
            }
            return res;
          }
          if (regexForGenericFunctinoInLine.test(l)) {
            if (l.endsWith('{')) {
              mode = 'function';
              return org;
            } else {
              const begin = l.match(regexForGenericFunctinoInLine)[0];
              const after = `<(any?):any {};`;
              if (mode === 'function') {
                mode = void 0;
                return `${specialFunctionEnd}\nexport ${begin}${after}`;
              }
              return `export ${begin}${after}`;
            }
          }
          if (regexForFunctinoInLine.test(l)) {
            if (l.endsWith('{')) {
              mode = 'function';
              return org;
            } else {
              const begin = l.match(regexForFunctinoInLine)[0];
              const after = `any?):any {};`;
              if (mode === 'function') {
                mode = void 0;
                return `${specialFunctionEnd}\nexport ${begin}${after}`;
              }
              return `export ${begin}${after}`;
            }
          }
          if (regexForClassStaticFunctinoInLine.test(l)) {
            if (l.endsWith('{')) {
              return `// @ts-ignore\n` + org;
            } else if (l.endsWith(');')) { // constructor
              return `// @ts-ignore\n` + `${l.replace(/\)\;$/, ') { };')}`;
            } else if (l.endsWith('>;')) { // generic end
              return `// @ts-ignore\n` + `${l.replace(/\>\;$/, '> { };')}`;
            } else {
              return `// @ts-ignore\n` + org;
            }
          }
          if (regexForClassFunctinoInLine.test(l)) {
            if (l.endsWith('{')) {
              return `// @ts-ignore\n` + org;
            } else if (l.endsWith(');')) { // constructor
              return `// @ts-ignore\n` + `${l.replace(/\)\;$/, ') { };')}`
            } else if (l.endsWith('>;')) { // generic end
              return `// @ts-ignore\n` + `${l.replace(/\>\;$/, '> { };')}`;
            } else {
              return `// @ts-ignore\n` + org;
            }
          }
          // if(mode === 'function' && l.endsWith(';')) {
          //   mode = void 0;
          //   return l.replace(/\;$/,' { return void 0; }');
          // }
          return org;
        })
        .join('\n');

      // post processing
      newContent = newContent.replace(
        new RegExp(`\;\\n${Helpers.escapeStringForRegEx(specialFunctionEnd)}`, 'g'),
        ' { return void 0; }\n')
      Helpers.writeFile(newFile, Helpers.generatedFileWrap(newContent));
      Helpers.removeFileIfExists(f);
    }

    //#region handle absolute referenes
    const tsFoldersInSrc = fse
      .readdirSync(path.join(proj.location, config.folder.src))
      .filter(f => {
        const fileOrFoler = path.join(proj.location, config.folder.src, f);
        return fse.lstatSync(fileOrFoler).isDirectory();
      })
    Helpers.mkdirp(path.join(proj.location, config.folder.node_modules));

    tsFoldersInSrc.concat([config.file.index_ts]).forEach(folderName => {
      const source = path.join(proj.location, config.folder.src, folderName);
      const dest = path.join(proj.location, config.folder.node_modules, proj.name, folderName);
      Helpers.createSymLink(source, dest);
    });
    //#endregion


    const allPublicApis = glob.sync(`${proj.location}/src/**/public_api.ts`);
    allPublicApis.forEach(source => {
      const dest = path.join(path.dirname(source), config.file.index_ts);
      Helpers.copyFile(source, dest);
      // Helpers.createSymLink(source,dest);
    })

    Helpers.writeFile(path.join(proj.location, config.file.tsconfig_json),
      {
        "compilerOptions": {
          "module": "commonjs",
          "declaration": true,
          "removeComments": false,
          "preserveConstEnums": true,
          "sourceMap": true,
          "outDir": "dist"
        },
        "include": [
          "./src"
        ]
      });

    Helpers.writeFile(path.join(proj.location, config.file.index_d_ts),
      Helpers.generatedFileWrap(`export * from './dist';`));

    Helpers.writeFile(path.join(proj.location, config.file.index_js), Helpers.generatedFileWrap(`
    "use strict";
    Object.defineProperty(exports, '__esModule', { value: true });
    var tslib_1 = require('tslib');
    var index_1 = require("./index");
    tslib_1.__exportStar(require('./dist'), exports);
    exports.default = index_1.default;
            `.trim()));

    Helpers.removeFolderIfExists(path.join(proj.location, config.folder.dist));
    try {
      proj.run('npm-run tsc').sync(); // TODO bette algorith for stubs + npm pacakge firedev-tsc + release of all packages
      // Helpers.removeFolderIfExists(path.join(proj.location, config.folder.src));
      // tsFoldersInSrc.forEach(folderLinkName => {
      //   Helpers.removeFileIfExists(path.join(proj.location, folderLinkName));
      // })
      // Helpers.removeFileIfExists(path.join(proj.location, config.file.tsconfig_json));
      // Helpers.removeFolderIfExists(path.join(proj.location, config.folder.node_modules));
      // createSubVersion(proj, tsFoldersInSrc);


    } catch (er) {
      Helpers.error(`Not able to suberize pacakge "${packageName}"`, false, true);
    }
  }

}
//#endregion
