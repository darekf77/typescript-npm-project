import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'
import * as rimraf from 'rimraf';
// local
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { config } from '../../../config';
import chalk from 'chalk';
import { TnpDB } from '../../../tnp-db';
import { FeatureForProject, FeatureCompilerForProject } from '../../abstract';

import { IncCompiler } from 'incremental-compiler';
import { Project } from '../../../index';
import { FilesJoinActions } from './files-join-actions.backend';
import { HelpersMerge } from './merge-helpers.backend';

function optionsBaselineSiteJoin(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  let folderPath: string | string[] = void 0;
  if (project.isSite) {
    if (project.isWorkspace) {
      folderPath = [
        path.join(project.location, config.folder.custom),
        ...[
          ...project.baseline.customizableFilesAndFolders,
          ...project.baseline.quickFixes.nodeModulesReplacementsZips,
          ...project.baseline.node_modules.fixesForNodeModulesPackages,
        ].map(relativeFilePath => {
          return path.join(project.baseline.location, relativeFilePath)
        })
      ]
    }
    if (project.isWorkspaceChildProject) {
      folderPath = [
        path.join(project.location, config.folder.custom),
        path.join(project.baseline.location, config.folder.src),
        (project.type === 'angular-lib' && path.join(project.baseline.location, config.folder.components))
      ].filter(f => !!f);
    }
  }

  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath,
    notifyOnFileUnlink: true
  };
  // if(project.name === 'simple-site') {
  //   console.log(options)
  // }
  return options;
}

@IncCompiler.Class({ className: 'BaselineSiteJoin' })
export class BaselineSiteJoin extends FeatureCompilerForProject {
  constructor(public project: Project) {
    super(project, optionsBaselineSiteJoin(project), true);
  }


  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    const modifiedFiles: Models.other.ModifiedFiles = { modifiedFiles: [] };
    const absolutePath = event.fileAbsolutePath;
    const relativePath = this.resolvePath(absolutePath);
    this.merge(relativePath, modifiedFiles);
  }

  /**
   * check at start if files in (src|componets) should exisit in site project
   */
  private get syncActionAlreadyMergedFiles() {
    let files = [];
    files = files.concat(glob.sync(`${path.join(this.project.location, config.folder.src)}/**/*.*`));
    if (this.project.type === 'angular-lib') {
      files = files.concat(glob.sync(`${path.join(this.project.location, config.folder.components)}/**/*.*`));
    }
    return files;
  }

  async syncAction(filesAbsolutePathes: string[]) {

    filesAbsolutePathes = filesAbsolutePathes.concat(this.syncActionAlreadyMergedFiles);
    // console.log('syncAction', filesAbsolutePathes)

    filesAbsolutePathes = filesAbsolutePathes.map(absolutePath => {
      return this.resolvePath(absolutePath);
    });

    // glob.sync(`${this.project.location}`)
    filesAbsolutePathes = Helpers.arrays.uniqArray(filesAbsolutePathes)
    // console.log('relatives', filesAbsolutePathes)
    // process.exit(0)
    // console.log('filesAbsolutePathes', filesAbsolutePathes)
    const modifiedFiles: Models.other.ModifiedFiles = { modifiedFiles: [] }
    for (let index = 0; index < filesAbsolutePathes.length; index++) {
      const relativePath = filesAbsolutePathes[index];
      // console.log(`= ${relativePath}`)
      this.merge(relativePath, modifiedFiles);
    }
    // console.log('modifierFiled', modifiedFiles);
  }

  /// @LAST handle files deletion in site
  private resolvePath(absolutePath: string) {
    const customPath = path.join(this.project.location, config.folder.custom);
    if (absolutePath.startsWith(customPath)) {
      return absolutePath.replace(customPath, '').replace(/^\//, '');
    }
    const baselinePath = path.join(this.project.baseline.location);
    if (absolutePath.startsWith(baselinePath)) {
      return absolutePath.replace(baselinePath, '').replace(/^\//, '');
    }
    const sitePath = path.join(this.project.location);
    if (absolutePath.startsWith(sitePath)) {
      return absolutePath.replace(sitePath, '').replace(/^\//, '');
    }
    // console.log('absolutePath',absolutePath)
    return absolutePath;
  }

  //#region merge strategy
  private merge(relativeBaselineCustomPath: string, modifiedFiles: Models.other.ModifiedFiles)
    : Models.other.ModifiedFiles {
    //#region debug
    const isDebugMode = config.debug.baselineSiteJoin.DEBUG_MERGE_PATHES.includes(relativeBaselineCustomPath)

    if (isDebugMode) {
      console.log(_.times(5, () => '\n').join())
      console.log(chalk.blue(`Baseline/Site modyfication detected...`))
      console.log(`File: ${relativeBaselineCustomPath}`)
    }
    //#endregion

    const baselineAbsoluteLocation = path.join(HelpersMerge
      .pathToBaselineThroughtNodeModules(this.project), relativeBaselineCustomPath)

    const baselineFileInCustomPath = path.join(HelpersMerge
      .pathToCustom(this.project), relativeBaselineCustomPath);

    const joinFilePath = path.join(this.project.location, relativeBaselineCustomPath);

    let variant: 'no-in-custom' | 'no-in-baseline' | 'join' | 'deleted';
    //#region debug
    if (isDebugMode) {
      console.log('baselineAbsoluteLocation', baselineAbsoluteLocation)
      console.log('baselineFileInCustomPath', baselineFileInCustomPath)
      console.log('joinFilePath', joinFilePath)
    }
    //#endregion

    if (fse.existsSync(baselineFileInCustomPath)) {

      if (fse.existsSync(baselineAbsoluteLocation)) {
        variant = 'join'
        // Helpers.log(variant)
        Helpers.copyFile(
          baselineAbsoluteLocation,
          HelpersMerge.getPrefixedPathInJoin(relativeBaselineCustomPath, this.project),
          { modifiedFiles }
        )
      } else {
        variant = 'no-in-baseline'
        // Helpers.log(variant)
        Helpers.removeFileIfExists(
          HelpersMerge.getPrefixedPathInJoin(relativeBaselineCustomPath, this.project),
          { modifiedFiles }
        );
        // Helpers.log('after');
      }

      const replace = config.extensions.modificableByReplaceFn.includes(path.extname(baselineFileInCustomPath));
      const transformTextFn = replace ? this.replacePathFn(relativeBaselineCustomPath) : void 0;
      //#region debug
      if (isDebugMode) console.log(`SOURCE: ${baselineFileInCustomPath} ,extname: ${path.extname(baselineFileInCustomPath)}`)
      if (isDebugMode) console.log(`DEST: ${joinFilePath} ,extname: ${path.extname(joinFilePath)}`)
      if (isDebugMode) console.log(`Replace fn for ${baselineFileInCustomPath} = ${!!transformTextFn}`)
      //#endregion
      Helpers.copyFile(
        baselineFileInCustomPath,
        joinFilePath,
        {
          transformTextFn,
          debugMode: isDebugMode,
          fast: false,
          modifiedFiles
        }
      )
    } else {
      if (fse.existsSync(baselineAbsoluteLocation)) {
        variant = 'no-in-custom'
        // Helpers.log(variant)
        Helpers.copyFile(baselineAbsoluteLocation, joinFilePath, { fast: true, modifiedFiles });
        Helpers.removeFileIfExists(
          HelpersMerge.getPrefixedPathInJoin(relativeBaselineCustomPath, this.project),
          { modifiedFiles }
        );
      } else {
        variant = 'deleted'
        // Helpers.log(`${variant}: ${joinFilePath}`)
        Helpers.removeFileIfExists(
          joinFilePath,
          { modifiedFiles }
        );
        Helpers.removeFileIfExists(
          HelpersMerge.getPrefixedPathInJoin(relativeBaselineCustomPath, this.project),
          { modifiedFiles }
        );
      }
    }
    //#region debug
    if (isDebugMode) {
      console.log(`${chalk.blueBright('Baseline/Site modyfication OK ')}, (action: ${variant}) `)
    }
    //#endregion
    return modifiedFiles;
  }

  private replacePathFn(relativeBaselineCustomPath: string) {
    // console.log('relativeBaselineCustomPath', relativeBaselineCustomPath)
    return (input) => {
      input = this.replace(input, relativeBaselineCustomPath)._1___handlePrefixingFilesToEasyOverride();
      input = this.replace(input, relativeBaselineCustomPath)._2___handleReferingTOAngularLibModulesName();
      input = this.replace(input, relativeBaselineCustomPath)._3___handleReferingToBaselinePathes();
      input = this.replace(input, relativeBaselineCustomPath)._4___handleReferingToNewFilesOnlyAvailableInCustom();
      return input;
    }
  }
  //#endregion


}

export interface BaselineSiteJoin extends Partial<FilesJoinActions> { }

Helpers.applyMixins(BaselineSiteJoin, [FilesJoinActions]);
