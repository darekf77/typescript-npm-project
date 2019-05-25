//#region imports
import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
import * as rimraf from 'rimraf';
// local
import { Project } from "../../abstract";
import config from '../../../config';
//#endregion


const BaselineSiteJoinprefix = '__';

export const moduleNameAngularLib = [
  config.folder.components,
  config.folder.module,
  config.folder.dist,
  config.folder.browser,
];

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


// export function  handleUsingSelfPathesInAngularLib(joinFilePath: string) {
//   // console.log(`this project: ${this.project.location}`)
//   // console.log(`baseline: ${this.project.baseline.location}`)
//   // console.log(`joinFilePath: ${joinFilePath}`)
//   let orgFileCopiedToSIte = fse.readFileSync(joinFilePath, { encoding: 'utf8' });
//   const reg = new RegExp(`${this.project.name}\/${config.folder.components}`, 'g')
//   orgFileCopiedToSIte = orgFileCopiedToSIte.replace(reg,
//     `${this.project.parent.baseline.name}/${this.project.name}/${config.folder.components}`);
//   fse.writeFileSync(joinFilePath, orgFileCopiedToSIte, { encoding: 'utf8' });
// }

