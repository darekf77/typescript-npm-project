//#region imports
import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
import * as rimraf from 'rimraf';
// local
import { Project } from '../../abstract';
import {config} from '../../../config';
import { Helpers } from '../../../helpers';
import chalk from 'chalk';
//#endregion


const BaselineSiteJoinprefix = '__';

export function getRegexSourceString(s) {
  return s
    .replace(/\//g, '\\/')
    .replace(/\-/g, '\\-')
    .replace(/\+/g, '\\+')
    .replace(/\./g, '\\.')
    .replace(/\_/g, '\\_')
}

export const PathHelper = {
  PREFIX(baseFileName) {
    return `${BaselineSiteJoinprefix}${baseFileName}`
  },
  removeRootFolder(filePath: string) {
    const pathPart = `(\/([a-zA-Z0-9]|\\-|\\_|\\+|\\.)*)`
    return filePath.replace(new RegExp(`^${pathPart}`, 'g'), '')
  },
  removeExtension(filePath: string) {
    const ext = path.extname(filePath);
    return path.join(path.dirname(filePath), path.basename(filePath, ext))
  },
  isBaselineParent(filePath: string) {
    const basename = path.basename(filePath);
    return basename.startsWith(BaselineSiteJoinprefix)
  }

}


export function getPrefixedBasename(relativeFilePath: string) {
  const ext = path.extname(relativeFilePath);
  const basename = path.basename(relativeFilePath, ext)
    .replace(/\/$/g, ''); // replace last part of url /

  const resultPath = PathHelper.PREFIX(`${basename}${ext}`);
  return resultPath;
}

export function getPrefixedPathInJoin(relativeFilePath: string, project: Project) {

  const dirPath = path.dirname(relativeFilePath);

  const resultPath = path.join(
    project.location,
    dirPath,
    getPrefixedBasename(relativeFilePath));

  return resultPath;
}

export function fastCopy(source: string, dest: string) {

  const destDirPath = path.dirname(dest);
  // console.log('destDirPath', destDirPath)
  if (!fs.existsSync(destDirPath)) {
    fse.mkdirpSync(destDirPath)
  }
  fse.copyFileSync(source, dest)
}

export function fastUnlink(filePath) {
  if (fs.existsSync(filePath)) {
    fse.unlinkSync(filePath)
  }
}

export function pathToBaselineNodeModulesRelative(project: Project) {
  const baselinePath = project.type === 'workspace' ? project.baseline.name
    : path.join(project.baseline.parent.name, project.baseline.name)

  return baselinePath;
}

export function pathToBaselineThroughtNodeModules(project: Project) {
  const baselinePath = pathToBaselineNodeModulesRelative(project);

  const resultPath = path.join(
    project.location,
    config.folder.node_modules,
    baselinePath
  );
  return resultPath;
}


export function allCustomFiles(project: Project) {

  const globPath = path.join(
    project.location,
    config.folder.custom);
  const files = glob.sync(`${globPath}/**/*.*`);
  // console.log('CUSTOM FIELS', files)

  return files;
}

export function allBaselineFiles(project: Project) {

  let files = [];

  project.baseline.customizableFilesAndFolders.forEach(customizableFileOrFolder => {
    let globPath = path.join(pathToBaselineThroughtNodeModules(project), customizableFileOrFolder)
    if (!fse.existsSync(globPath)) {
      Helpers.error(`Custombizable folder of file doesn't exist: ${globPath}

      Please add: ${path.basename(globPath)} to your baseline

      or maybe forget ${chalk.bold('tnp install')} or ${chalk.bold('tnp link')} ?

      `)
    }
    if (fse.statSync(globPath).isDirectory()) {
      const globFiles = glob.sync(`${globPath}/**/*.*`);
      files = files.concat(globFiles);
    } else {
      files.push(globPath)
    }

  })
  // console.log('allBaselineFiles', files)

  return files;
}


export function pathToBaselineAbsolute(project: Project) {
  const isInsideWokrspace = (project.parent && project.parent.type === 'workspace');

  const toReplace = path.join(
    isInsideWokrspace ? (
      path.join(project.parent.name, project.name))
      : project.name
    , config.folder.node_modules)

  // console.log('toReplace', toReplace)
  const resultPath = pathToBaselineThroughtNodeModules(project).replace(`${toReplace}/`, '')
  return resultPath;
}

export function pathToCustom(project: Project) {
  const resultPath = path.join(project.location, config.folder.custom);
  return resultPath;
}




export function relativePathesBaseline(project: Project) {
  let baselineFiles: string[] = allBaselineFiles(project);
  // console.log('baselineFiles', baselineFiles)
  const baselineReplacePath = pathToBaselineThroughtNodeModules(project);
  // console.log('baselineReplacePath', baselineReplacePath)

  baselineFiles = baselineFiles.map(f => f.replace(baselineReplacePath, ''))

  return baselineFiles;
}

export function relativePathesCustom(project: Project) {
  let customFiles: string[] = allCustomFiles(project);
  // console.log('customFiles', customFiles)
  const customReplacePath = path.join(project.location, config.folder.custom);
  // console.log('customReplacePath', customReplacePath)

  customFiles = customFiles.map(f => f.replace(customReplacePath, ''))

  return customFiles;
}
