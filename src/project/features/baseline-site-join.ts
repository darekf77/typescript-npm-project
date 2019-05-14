//#region @backend
import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
import * as rimraf from 'rimraf';
// local
import { Project } from "../abstract";
import { LibType, RecreateFile, FileEvent } from "../../models";
import { copyFile, uniqArray, crossPlatofrmPath, log } from '../../helpers';
import config from '../../config';
import { error } from '../../helpers';
import chalk from 'chalk';
import { run } from '../../helpers';
import { Helpers } from 'morphi/helpers';
import { TnpDB } from '../../tnp-db';
import { FeatureForProject } from '../abstract';


const REGEXS = {

  /**
   *   "baseline/ss-common-logic/src/db-mocks";
   *                            |<--------->|
   */
  baselinePart: `(\/([a-zA-Z0-9]|\\-|\\_|\\+|\\.)*)`

}

function getRegexSourceString(s) {
  return s
    .replace(/\//g, '\\/')
    .replace(/\-/g, '\\-')
    .replace(/\+/g, '\\+')
    .replace(/\./g, '\\.')
    .replace(/\_/g, '\\_')
}

const debugPathes = [
  // '/src/app/+preview-components/preview-components.component.ts',
  // '/src/controllers.ts',
]

const debugMerge = [
  // '/components/formly/base-components/editor/editor-wrapper.component.ts'
  // "/src/app/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts"
]


interface JoinFilesOptions {
  baselineAbsoluteLocation: string;
}

export class BaselineSiteJoin extends FeatureForProject {
  private readonly ALLOWED_EXT_TO_REPLACE_BASELINE_PATH = ['.ts', '.js', '.scss', '.css']
  private static readonly prefix = '__';

  public static get PathHelper() {
    return {
      PREFIX(baseFileName) {
        return `${BaselineSiteJoin.prefix}${baseFileName}`
      },
      removeRootFolder(filePath: string) {
        const pathPart = `(\/([a-zA-Z0-9]|\\-|\\_|\\+|\\.)*)`
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

  joinNotAllowed = false;
  async init() {
    if (!this.project.baseline) {
      return;
    }
    if (this.joinNotAllowed) {
      return this;
    }

    if (!this.project.isSite) {
      const db = await TnpDB.Instance;
      if (db.checkIf.allowed.toWatchWorkspace(this.project)) {
        log('OK to baseline/site join')
      } else {
        const pids = []
        log(`Current process pid: ${process.pid}`)
        log(`Found active baseline/site join on pids: ${pids.toString()}
        current pid: ${process.pid}, ppid ${process.ppid}`)
        this.joinNotAllowed = true;
        if (this.project.isWorkspaceChildProject) {
          this.project.parent.join.joinNotAllowed = true;
        }
        return this;
      }
    }


    // remove customizable
    // console.log(this.project.customizableFilesAndFolders);

    this.project.customizableFilesAndFolders.forEach(customizable => {
      rimraf.sync(`${this.project.location}/${customizable}`)
      // this.project.run(`rimraf ${customizable}`).sync()
    });
    // rejoin baseline/site files
    await this.join.allBaselineSiteFiles()
    return this;
  }


  async initAndWatch() {
    await this.init();
    await this.watch()
  }

  private get relativePathesBaseline() {
    let baselineFiles: string[] = this.files.allBaselineFiles;
    // console.log('baselineFiles', baselineFiles)
    const baselineReplacePath = this.pathToBaselineThroughtNodeModules;
    // console.log('baselineReplacePath', baselineReplacePath)

    baselineFiles = baselineFiles.map(f => f.replace(baselineReplacePath, ''))

    return baselineFiles;
  }

  private get relativePathesCustom() {
    let customFiles: string[] = this.files.allCustomFiles;
    // console.log('customFiles', customFiles)
    const customReplacePath = crossPlatofrmPath(path.join(this.project.location, config.folder.custom));
    // console.log('customReplacePath', customReplacePath)

    customFiles = customFiles.map(f => f.replace(customReplacePath, ''))

    return customFiles;
  }

  private get files() {
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

            Please add: ${path.basename(globPath)} to your baseline

            or maybe forget ${chalk.bold('tnp install')} or ${chalk.bold('tnp link')} ?

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

  private copyJoin(source: string, dest: string, relativeBaselineCustomPath: string, debugModel = false) {
    if (debugModel) console.log(`SOURCE: ${source} ,extname: ${path.extname(source)}`)
    if (debugModel) console.log(`DEST: ${dest} ,extname: ${path.extname(dest)}`)

    const replace = this.ALLOWED_EXT_TO_REPLACE_BASELINE_PATH.includes(path.extname(source));
    const replaceFn = replace ? this.replacePathFn(relativeBaselineCustomPath) : undefined;
    if (debugModel) console.log(`Replace fn for ${source} = ${!!replaceFn}`)

    copyFile(
      source,
      dest,
      replaceFn,
      debugModel
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
    const debuggin = (debugPathes.includes(relativeBaselineCustomPath));
    if (debuggin) console.log(`relativeBaselineCustomPath: ${relativeBaselineCustomPath}`)

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

              baselineFilePathNoExit = getRegexSourceString(baselineFilePathNoExit);
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

      /**
       * Replace imports/export
       * Scope: current files baseline path in current generated file
       * Example:
       *  File: exmpale.ts
       *   Code change:
       *     From  : `import {..} from 'baseline/exapmle.ts`
       *     To    : `import {..} from './__exapmle.ts`
       *
       * Notes:
       *  Problem1 : If import `import {..} from 'baseline/exapmle.ts` is included in different files
       * than example.ts it is not going to be excluded
       */
      currentFilePath() {



        const baselineFilePathNoExit = BaselineSiteJoin.PathHelper.removeExtension(relativeBaselineCustomPath);
        if (debuggin) console.log(`baselineFilePathNoExit: ${baselineFilePathNoExit}`)

        const toReplaceImportPath =
          getRegexSourceString(
            crossPlatofrmPath(
              `${path.join(self.pathToBaselineNodeModulesRelative.replace(/\//g, '//'),
                baselineFilePathNoExit)}`
            )
          )

        const replacement = `./${self.getPrefixedBasename(baselineFilePathNoExit)}`;

        // if (debuggin) console.log(`toReplaceImportPath: ${toReplaceImportPath}`)
        if (debuggin) console.log(`replacement: ${replacement}`)

        const replaceRegex = new RegExp(`(\"|\')${toReplaceImportPath}(\"|\')`, 'g')

        if (debuggin) {
          console.log(`replaceRegex: ${replaceRegex.source}`)
        }

        input = input.replace(replaceRegex, `'${replacement}'`);
        if (debuggin) console.log(`
        result input:
        ${input}


        `)

        return input;
      },


      /**
       * Same thing like in currentFilePath() but:
       *  - handle situation like in Problem1;
       *  - handle situation when in your custom files you are referening to custom files
       */
      baselinePath() {


        const debuggin = (debugPathes.includes(relativeBaselineCustomPath));

        if (debuggin) console.log(`

        relativeBaselineCustomPath:${relativeBaselineCustomPath}


        `)
        const levelBack = relativeBaselineCustomPath.split('/').length - 3;
        const levelBackPath = _.times(levelBack, () => '../').join('').replace(/\/$/g, '');
        if (debuggin) console.log(`Level back for ${relativeBaselineCustomPath} is ${levelBack} ${levelBackPath}`)
        const pathToBaselineNodeModulesRelative = getRegexSourceString(self.pathToBaselineNodeModulesRelative)
        const pathPart = REGEXS.baselinePart;
        if (debuggin) console.log('pathPart', pathPart)
        const baselineRegex = `${pathToBaselineNodeModulesRelative}${pathPart}*`
        if (debuggin) console.log(`\nbaselineRegex: ${baselineRegex}`)
        let patterns = input.match(new RegExp(baselineRegex, 'g'))


        if (debuggin) console.log(`patterns\n`, _.isArray(patterns) && patterns.map(d => `\t${d}`).join('\n'))


        if (Array.isArray(patterns) && patterns.length >= 1) {
          patterns.forEach(pathToReplaceInInput => {

            if (debuggin) console.log(`PATTERN IN INPUT ${pathToReplaceInInput}`)

            let patternWithoutBaselinePart = pathToReplaceInInput
              .replace(self.pathToBaselineNodeModulesRelative, '')
            if (debuggin) console.log(`PATTERN WITHOUT BASELINE:${patternWithoutBaselinePart}`)
            if (debuggin) console.log(`pathPart = ${pathPart}`)

            patternWithoutBaselinePart = patternWithoutBaselinePart
              .replace(new RegExp(`^${pathPart}`, 'g'), '')

            if (debuggin) console.log('PATTERN WITHOUT BASELINE no path part', patternWithoutBaselinePart)
            const toReplace = `${levelBackPath}${patternWithoutBaselinePart}`
            if (debuggin) console.log(`toReplace:${toReplace}`)
            input = input.replace(pathToReplaceInInput, `.${toReplace}`.replace('...', '..'))
          })
        }
        return input;
      }
    }

  }



  private merge(relativeBaselineCustomPath: string) {

    const isDebugMode = debugMerge.includes(relativeBaselineCustomPath)
    if (isDebugMode) {
      console.log(_.times(5, () => '\n').join())
      console.log(chalk.blue(`Baseline/Site modyfication detected...`))
      console.log(`File: ${relativeBaselineCustomPath}`)
    }

    const baselineAbsoluteLocation = path.join(this.pathToBaselineThroughtNodeModules, relativeBaselineCustomPath)
    const baselineFileInCustomPath = path.join(this.pathToCustom, relativeBaselineCustomPath);
    const joinFilePath = path.join(this.project.location, relativeBaselineCustomPath);

    let variant: 'no-in-custom' | 'no-in-baseline' | 'join' | 'deleted';
    if (isDebugMode) {
      console.log('baselineAbsoluteLocation', baselineAbsoluteLocation)
      console.log('baselineFileInCustomPath', baselineFileInCustomPath)
      console.log('joinFilePath', joinFilePath)
    }

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
        relativeBaselineCustomPath,
        isDebugMode
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

    // if (debugMerge.includes(relativeBaselineCustomPath)) {
    //   const ext = path.extname(joinFilePath)
    //   console.log('ext',ext)
    // }
    if (this.project.type === 'isomorphic-lib') {
      // this.handleUsingSelfPathesInAngularLib(joinFilePath)
      this.handleUsingBaselineAngularLibInsideSiteIsomorphicLIb(joinFilePath);
    }
    // }


    if (isDebugMode) {
      console.log(`${chalk.blueBright('Baseline/Site modyfication OK ')}, (action: ${variant}) `)
    }
  }


  /**
   * Example:
   *
   * In my angular-lib, I've got file with content:
   * import { Helpers }  from 'ss-common-ui/component/helpers';
   *
   * insted having log path thats sucks
   *import { Helpers }  from '../../../../..//helpers';
   *
   *
   * @param joinFilePath
   */
  // private handleUsingSelfPathesInAngularLib(joinFilePath: string) {
  //   // console.log(`this project: ${this.project.location}`)
  //   // console.log(`baseline: ${this.project.baseline.location}`)
  //   // console.log(`joinFilePath: ${joinFilePath}`)
  //   let orgFileCopiedToSIte = fse.readFileSync(joinFilePath, { encoding: 'utf8' });
  //   const reg = new RegExp(`${this.project.name}\/${config.folder.components}`, 'g')
  //   orgFileCopiedToSIte = orgFileCopiedToSIte.replace(reg,
  //     `${this.project.parent.baseline.name}/${this.project.name}/${config.folder.components}`);
  //   fse.writeFileSync(joinFilePath, orgFileCopiedToSIte, { encoding: 'utf8' });
  // }


  private handleUsingBaselineAngularLibInsideSiteIsomorphicLIb(joinFilePath: string) {
    // console.log(`this project: ${this.project.location}`)
    // console.log(`baseline: ${this.project.baseline.location}`)
    // console.log(`joinFilePath: ${joinFilePath}`)
    let orgFileCopiedToSIte = fse.readFileSync(joinFilePath, { encoding: 'utf8' });

    const moduleName = [
      config.folder.components,
      config.folder.module,
      config.folder.dist,
    ];

    this.project.parent.children
      .filter(c => c.type === 'angular-lib')
      .map(c => c.name)
      .forEach(angularLibName => {
        const reg = new RegExp(`${this.project.parent.baseline.name}\/${angularLibName}\/(${moduleName.join('|')})`, 'g')

        orgFileCopiedToSIte = orgFileCopiedToSIte.replace(reg,
          `${angularLibName}/${config.folder.module}`);
      });


    fse.writeFileSync(joinFilePath, orgFileCopiedToSIte, { encoding: 'utf8' });
  }

  private get join() {
    const self = this;
    return {
      async allBaselineSiteFiles() {
        self.__checkBaselineSiteStructure()

        await Helpers.compilationWrapper(() => {
          uniqArray(self.relativePathesBaseline.concat(self.relativePathesCustom))
            .forEach(relativeFile => self.merge(relativeFile))
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

  private watch() {
    if (!this.project.baseline) {
      return;
    }
    if (this.joinNotAllowed) {
      return
    }
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
