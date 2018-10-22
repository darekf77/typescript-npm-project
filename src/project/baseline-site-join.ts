//#region @backend
import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
// local
import { Project } from "./base-project";
import { LibType, RecreateFile, FileEvent } from "../models";
import { copyFile, uniqArray, compilationWrapper, crossPlatofrmPath } from '../helpers';
import config from '../config';
import { error } from '../messages';
import chalk from 'chalk';

const REGEXS = {

  /**
   *   "baseline/ss-common-logic/src/db-mocks";
   *                            |<--------->|
   */
  baselinePart: `(\/([a-zA-Z0-9]|\\-|\\_|\\.)*)`

}



interface JoinFilesOptions {
  baselineAbsoluteLocation: string;
}

export class BaselineSiteJoin {
  private readonly ALLOWED_EXT_TO_REPLACE_BASELINE_PATH = ['.ts', '.js', '.scss', '.css']
  private static readonly prefix = '__';


  constructor(private project: Project) {
    // console.log(project)

  }




  public static get PathHelper() {
    return {
      PREFIX(baseFileName) {
        return `${BaselineSiteJoin.prefix}${baseFileName}`
      },
      removeRootFolder(filePath: string) {
        const pathPart = `(\/([a-zA-Z0-9]|\\-|\\_|\\.)*)`
        return filePath.replace(new RegExp(`^${pathPart}`, 'g'), '')
      },
      removeExtension(filePath: string) {
        const ext = path.extname(filePath);
        return crossPlatofrmPath(path.join(path.dirname(filePath), path.basename(filePath, ext)))
      },
      isBaselineParent(filePath: string) {
        const basename = path.basename(filePath);
        return basename.startsWith(BaselineSiteJoin.prefix)
      }
    }
  }

  private __checkBaselineSiteStructure() {
    if (!this.project.isBasedOnOtherProject) {
      console.trace(`There is no baseline project for "${this.project.name}" in ${this.project.location} `)
    }
  }

  init() {
    // remove customizable
    // console.log(this.project.customizableFilesAndFolders);
    // process.exit(0)
    this.project.customizableFilesAndFolders.forEach(customizable => {
      this.project.run(`rimraf ${customizable}`).sync()
    });
    // rejoin baseline/site files
    this.join.allBaselineSiteFiles()
    return this;
  }

  get relativePathesBaseline() {
    let baselineFiles: string[] = this.files.allBaselineFiles;
    // console.log('baselineFiles', baselineFiles)
    const baselineReplacePath = this.pathToBaselineThroughtNodeModules;
    // console.log('baselineReplacePath', baselineReplacePath)
    // process.exit(0)
    baselineFiles = baselineFiles.map(f => f.replace(baselineReplacePath, ''))

    return baselineFiles;
  }

  get relativePathesCustom() {
    let customFiles: string[] = this.files.allCustomFiles;
    // console.log('customFiles', customFiles)
    const customReplacePath = crossPlatofrmPath(path.join(this.project.location, config.folder.custom));
    // console.log('customReplacePath', customReplacePath)
    // process.exit(0)
    customFiles = customFiles.map(f => f.replace(customReplacePath, ''))

    return customFiles;
  }

  get files() {
    this.__checkBaselineSiteStructure()
    const self = this;
    return {
      get allCustomFiles() {

        const globPath = path.join(
          self.project.location,
          config.folder.custom);
        const files = glob.sync(`${globPath}/**/*.*`);
        // console.log('CUSTOM FIELS', files)

        return files;
      },
      get allBaselineFiles() {

        let files = [];
        // console.log('CUSTOMIZABLE', this.project.baseline.customizableFilesAndFolders)

        self.project.baseline.customizableFilesAndFolders.forEach(customizableFileOrFolder => {
          let globPath = path.join(self.pathToBaselineThroughtNodeModules, customizableFileOrFolder)
          if (!fs.existsSync(globPath)) {
            error(`Custombizable folder of file doesn't exist: ${globPath}

            Please add: ${path.basename(globPath)} to your baseline.

            `)
          }
          if (fs.statSync(globPath).isDirectory()) {
            const globFiles = glob.sync(`${globPath}/**/*.*`);
            files = files.concat(globFiles);
          } else {
            files.push(globPath)
          }

        })
        // console.log('allBaselineFiles', files)

        return files;
      }
    }
  }

  private copyJoin(source: string, dest: string, relativeBaselineCustomPath: string) {
    // console.log(`Extname from ${source}: ${path.extname(source)}`)

    const replace = this.ALLOWED_EXT_TO_REPLACE_BASELINE_PATH.includes(path.extname(source));
    const replaceFn = replace ? this.replacePathFn(relativeBaselineCustomPath) : undefined;
    // console.log(`Replace fn for ${source} = ${!!replaceFn}`)
    copyFile(
      source,
      dest,
      replaceFn
    )
  }
  private fastCopy(source: string, dest: string) {

    const destDirPath = path.dirname(dest);
    // console.log('destDirPath', destDirPath)
    if (!fs.existsSync(destDirPath)) {
      fse.mkdirpSync(destDirPath)
    }
    fse.copyFileSync(source, dest)
  }

  private fastUnlink(filePath) {
    if (fs.existsSync(filePath)) {
      fse.unlinkSync(filePath)
    }
  }

  private replacePathFn(relativeBaselineCustomPath: string) {
    return (input) => {
      input = this.replace(input, relativeBaselineCustomPath).currentFilePath()
      input = this.replace(input, relativeBaselineCustomPath).baselinePath()
      input = this.replace(input, relativeBaselineCustomPath).customRelativePathes()
      return input;
    }
  }

  private replace(input: string, relativeBaselineCustomPath: string) {
    const self = this;
    return {
      normalizePathes() { // TODO

      },
      customRelativePathes() {
        self.relativePathesCustom.forEach(f => {
          if (f != relativeBaselineCustomPath) {
            let baselineFilePathNoExit = BaselineSiteJoin.PathHelper.removeExtension(f);

            const pathToSiteeFile = crossPlatofrmPath(path.join(self.project.location, baselineFilePathNoExit))
            const pathToBaselineFile = crossPlatofrmPath(path.join(self.pathToBaselineAbsolute, baselineFilePathNoExit))

            if (fse.existsSync(pathToBaselineFile) && !fse.existsSync(pathToSiteeFile)) {
              let toReplace = self.getPrefixedBasename(baselineFilePathNoExit);

              baselineFilePathNoExit = baselineFilePathNoExit
                .replace('/', '\/')
                .replace('-', '\-')
                .replace('.', '\.')
                .replace('_', '\_')
              baselineFilePathNoExit = `\.${BaselineSiteJoin.PathHelper.removeRootFolder(baselineFilePathNoExit)}`
              const dirPath = path.dirname(f);
              toReplace = BaselineSiteJoin.PathHelper.removeRootFolder(crossPlatofrmPath(path.join(dirPath, toReplace)))
              toReplace = `.${toReplace}`
              // console.log(`Replace: ${baselineFilePathNoExit} on this: ${toReplace}`)
              input = input.replace(new RegExp(baselineFilePathNoExit, 'g'), toReplace)
            }
          }
        });
        return input;
      },
      currentFilePath() {
        const baselineFilePathNoExit = BaselineSiteJoin.PathHelper.removeExtension(relativeBaselineCustomPath);


        const toReplaceImportPath = crossPlatofrmPath(`${path.join(
          self.pathToBaselineNodeModulesRelative.replace(/\//g, '//'),
          baselineFilePathNoExit)}`);
        const replacement = `./${self.getPrefixedBasename(baselineFilePathNoExit)}`;

        const res = input.replace(new RegExp(`(\"|\')${toReplaceImportPath}(\"|\')`, 'g'), `'${replacement}'`);

        return res;
      },
      baselinePath() {
        // console.log('relativeBaselineCustomPath', relativeBaselineCustomPath)
        const levelBack = relativeBaselineCustomPath.split('/').length - 3;
        const levelBackPath = _.times(levelBack, () => '../').join('').replace(/\/$/g, '');
        // console.log(`Level back for ${relativeBaselineCustomPath} is ${levelBack} ${levelBackPath}`)
        const pathToBaselineNodeModulesRelative = self.pathToBaselineNodeModulesRelative
          .replace('/', '\/')
          .replace('-', '\-')
          .replace('.', '\.')
          .replace('_', '\_')
        const pathPart = REGEXS.baselinePart;
        // console.log('pathPart', pathPart)
        const baselineRegex = `${pathToBaselineNodeModulesRelative}${pathPart}*`
        // console.log(`\nbaselineRegex: ${baselineRegex}`)
        let patterns = input.match(new RegExp(baselineRegex, 'g'))
        // if (relativeBaselineCustomPath === "/src/index.ts") {
        //     // console.log('input', input)
        //     console.log(patterns)
        //     //     console.log(`patterns\n`, patterns.map(d => `\t${d}`).join('\n'))
        // }

        if (Array.isArray(patterns) && patterns.length >= 1) {
          patterns.forEach(p => {
            let patternWithoutBaselinePart = p
              .replace(self.pathToBaselineNodeModulesRelative, '')
            // console.log('patternWithoutBaselinePart', patternWithoutBaselinePart)
            patternWithoutBaselinePart = patternWithoutBaselinePart
              .replace(new RegExp(`^${pathPart}`, 'g'), '')
            // console.log('patternWithoutBaselinePart rep', patternWithoutBaselinePart)

            //  console.log('patternWithoutBaselinePart', patternWithoutBaselinePart)
            // console.log('p', p)
            const toReplace = `${levelBackPath}${patternWithoutBaselinePart}`
            // console.log('toReplace', toReplace)
            input = input.replace(p, `.${toReplace}`.replace('...', '..'))
          })
        }
        return input;
      }
    }

  }


  private merge(relativeBaselineCustomPath: string, verbose = true) {
    // console.log('relativeBaselineCustomPath', relativeBaselineCustomPath)
    if (verbose) {
      console.log(chalk.blue(`Baseline/Site modyfication detected...`))
      console.log(`File: ${relativeBaselineCustomPath}`)
    }
    // compilationWrapper(() => {
    const baselineAbsoluteLocation = path.join(this.pathToBaselineThroughtNodeModules, relativeBaselineCustomPath)
    const baselineFileInCustomPath = path.join(this.pathToCustom, relativeBaselineCustomPath)

    const joinFilePath = path.join(this.project.location, relativeBaselineCustomPath)
    let variant: 'no-in-custom' | 'no-in-baseline' | 'join' | 'deleted';


    if (fs.existsSync(baselineFileInCustomPath)) {

      if (fs.existsSync(baselineAbsoluteLocation)) {
        variant = 'join'
        this.fastCopy(baselineAbsoluteLocation, this.getPrefixedPathInJoin(relativeBaselineCustomPath))
      } else {
        variant = 'no-in-baseline'
        this.fastUnlink(this.getPrefixedPathInJoin(relativeBaselineCustomPath))
      }
      this.copyJoin(
        baselineFileInCustomPath,
        joinFilePath,
        relativeBaselineCustomPath
      )

    } else {
      if (fs.existsSync(baselineAbsoluteLocation)) {
        variant = 'no-in-custom'
        this.fastCopy(baselineAbsoluteLocation, joinFilePath);
        this.fastUnlink(this.getPrefixedPathInJoin(relativeBaselineCustomPath))
      } else {
        variant = 'deleted'
        this.fastUnlink(joinFilePath)
        this.fastUnlink(this.getPrefixedPathInJoin(relativeBaselineCustomPath))
      }
    }
    if (verbose) {
      console.log(`${chalk.blueBright('Baseline/Site modyfication OK ')}, (action: ${variant}) `)
    }
  }

  private get join() {
    const self = this;
    return {
      allBaselineSiteFiles() {
        self.__checkBaselineSiteStructure()

        compilationWrapper(() => {
          uniqArray(self.relativePathesBaseline.concat(self.relativePathesCustom))
            .forEach(relativeFile => self.merge(relativeFile, false))
        }, `Site join of all files for site project: ${self.project.name}`)
      },
      get watch() {
        return {
          baselineFileChange(filePath: string) {
            self.merge(filePath);
          },
          siteFileChange(filePath: string) {
            self.merge(filePath);
          }
        }
      }
    }
  }

  watch() {
    this.monitor((absolutePath, event, isCustomFolder) => {
      // console.log(`Event: ${chalk.bold(event)} for file ${absolutePath}`)
      absolutePath = crossPlatofrmPath(absolutePath)

      if (isCustomFolder) {
        this.join.watch.siteFileChange(absolutePath.replace(this.pathToCustom, ''));
      } else {
        this.join.watch.baselineFileChange(absolutePath.replace(this.pathToBaselineAbsolute, ''));
      }

    })
  }

  private monitor(callback: (absolutePath: string, event: FileEvent, isCustomFolder: boolean) => any) {
    this.watchFilesAndFolders(this.project.baseline.location, this.project.baseline.customizableFilesAndFolders, callback);
    this.watchFilesAndFolders(this.project.location, [config.folder.custom], callback)
  }

  private watchFilesAndFolders(location: string, customizableFilesOrFolders: string[],
    filesEventCallback: (absolutePath: string, event: FileEvent, isCustomFolder: boolean) => any) {

    this.__checkBaselineSiteStructure()

    const isCustomFolder = (customizableFilesOrFolders.filter(f => f === config.folder.custom).length === 1);

    customizableFilesOrFolders.forEach(baselieFileOrFolder => {
      const fileOrFolderPath = path.join(location, baselieFileOrFolder)
      if (!fs.existsSync(fileOrFolderPath)) {
        error(`File ${chalk.bold(chalk.underline(fileOrFolderPath))} doesn't exist and can't be monitored.`)
      }
      if (fs.statSync(fileOrFolderPath).isDirectory()) {
        console.log(`Monitoring directory: ${fileOrFolderPath} `)
        watch.watchTree(fileOrFolderPath, (f, curr, prev) => {
          if (typeof f == "object" && prev === null && curr === null) {
            // Finished walking the tree
          } else if (prev === null) {
            filesEventCallback(f as any, 'created', isCustomFolder)
          } else if (curr.nlink === 0) {
            filesEventCallback(f as any, 'removed', isCustomFolder)
          } else {
            filesEventCallback(f as any, 'changed', isCustomFolder)
            // f was changed
          }
        })
      } else {
        console.log(`Monitoring file: ${fileOrFolderPath} `)
        fs.watch(fileOrFolderPath, { recursive: true }, (event: 'rename' | 'change', filename) => {
          // console.log(`NODE FS WATCH Event: ${ event } for ${ filename }`)
          filesEventCallback(fileOrFolderPath as any, event === 'change' ? 'changed' : 'rename', isCustomFolder)
        })
      }


    });

  }

  private getPrefixedBasename(relativeFilePath: string) {
    const ext = path.extname(relativeFilePath);
    const basename = path.basename(relativeFilePath, ext)
      .replace(/\/$/g, ''); // replace last part of url /

    const resultPath = BaselineSiteJoin.PathHelper.PREFIX(`${basename}${ext}`);
    return crossPlatofrmPath(resultPath);
  }

  private getPrefixedPathInJoin(relativeFilePath: string) {

    const dirPath = path.dirname(relativeFilePath);

    const resultPath = path.join(
      this.project.location,
      dirPath,
      this.getPrefixedBasename(relativeFilePath));

    return crossPlatofrmPath(resultPath);
  }

  private get pathToBaselineAbsolute() {
    // console.log('this.pathToBaseline', this.pathToBaselineThroughtNodeModules)
    const isInsideWokrspace = (this.project.parent && this.project.parent.type === 'workspace');

    const toReplace = path.join(
      isInsideWokrspace ? (
        path.join(this.project.parent.name, this.project.name))
        : this.project.name
      , config.folder.node_modules)

    // console.log('toReplace', toReplace)
    const resultPath = this.pathToBaselineThroughtNodeModules.replace(`${toReplace}/`, '')
    return crossPlatofrmPath(resultPath);
  }

  private get pathToBaselineThroughtNodeModules() {
    const baselinePath = this.pathToBaselineNodeModulesRelative;

    const resultPath = path.join(
      this.project.location,
      config.folder.node_modules,
      baselinePath
    );
    return crossPlatofrmPath(resultPath);
  }

  private get pathToCustom() {
    const resultPath = path.join(this.project.location, config.folder.custom);
    return crossPlatofrmPath(resultPath);
  }

  private get pathToBaselineNodeModulesRelative() {
    const baselinePath = this.project.type === 'workspace' ? this.project.baseline.name
      : path.join(this.project.baseline.parent.name, this.project.baseline.name)

    return crossPlatofrmPath(baselinePath);
  }

}
//#endregion
