import * as fs from 'fs';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as watch from 'watch'

// local
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import chalk from 'chalk';
import { FeatureForProject, FeatureCompilerForProject } from '../../abstract';

import { IncCompiler } from 'incremental-compiler';
import { Project } from '../../abstract/project';
import { FilesJoinActions } from './files-join-actions.backend';
import { HelpersMerge } from 'tnp-helpers';


function optionsBaselineSiteJoin(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  let folderPath: string | string[] = void 0;
  if (project.isSiteInStrictMode) {
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
        (project.typeIs('angular-lib') && path.join(project.baseline.location, config.folder.components))
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
    const relativePath = this.resolveRelativePath(absolutePath);
    if (!relativePath) {
      return;
    }
    this.merge(relativePath, modifiedFiles);
  }

  /**
   * check at start if files in (src|componets) should exisit in site project
   */
  private get syncActionAlreadyMergedFiles() {
    let files = [];
    files = files.concat(glob.sync(`${path.join(this.project.location, config.folder.src)}/**/*.*`));
    if (this.project.typeIs('angular-lib')) {
      files = files.concat(glob.sync(`${path.join(this.project.location, config.folder.components)}/**/*.*`));
    }

    const genratedFiles = [
      ...this.project.projectSpecyficIgnoredFiles(),
      ...this.project.sourceFilesToIgnore(),
      ...this.project.filesTemplates(),
      ...this.project.quickFixes.nodeModulesReplacementsZips,
      ...this.project.node_modules.fixesForNodeModulesPackages,
    ];
    // console.log('genratedFiles', genratedFiles)
    // process.exit(0)
    // console.log('generated files', genratedFiles);

    return files.filter(f => {
      if (path.basename(f).startsWith(HelpersMerge.BaselineSiteJoinprefix)) {
        return false;
      }
      const relativePath = f.replace(this.project.location).replace(/^\//, '');
      if (genratedFiles.includes(relativePath)) {
        return false;
      }
      return true;
    });
  }

  async syncAction(filesAbsolutePathes: string[]) {

    filesAbsolutePathes = filesAbsolutePathes.concat(this.syncActionAlreadyMergedFiles);
    // console.log('syncAction', filesAbsolutePathes)

    filesAbsolutePathes = filesAbsolutePathes.map(absolutePath => {
      return this.resolveRelativePath(absolutePath);
    }).filter(f => !!f);


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
    // console.log('filesAbsolutePathes',filesAbsolutePathes);
    // process.exit(0)
    // console.log('modifierFiled', modifiedFiles);
  }

  private returnRelativePathIfAllowed(relativePath: string, contactWith: string) {
    const pathToCheck = path.join(contactWith, relativePath);
    const res = [
      ...this.project.sourceFilesToIgnore()
    ].includes(pathToCheck)
    if (res) {
      // console.log(`ignore: ${pathToCheck}`);
      return;
    }
    return relativePath;
  }

  private resolveRelativePath(absolutePath: string) {
    const customPath = path.join(this.project.location, config.folder.custom);
    if (absolutePath.startsWith(customPath)) {
      const relativePath = absolutePath.replace(customPath, '').replace(/^\//, '');
      return this.returnRelativePathIfAllowed(relativePath, config.folder.custom);
    }
    const baselinePath = path.join(this.project.baseline.location);
    if (absolutePath.startsWith(baselinePath)) {
      const relativePath = absolutePath.replace(baselinePath, '').replace(/^\//, '');
      return this.returnRelativePathIfAllowed(relativePath, '');
    }
    const sitePath = path.join(this.project.location);
    if (absolutePath.startsWith(sitePath)) {
      const relativePath = absolutePath.replace(sitePath, '').replace(/^\//, '');
      return this.returnRelativePathIfAllowed(relativePath, '');
    }
    Helpers.warn(`Unrecognized merge aciton for: ${absolutePath}`)
  }

  //#region merge strategy
  /**
   * relativeBaselineCustomPath -> example src/apps/auth/AuthController.ts
   */
  private merge(relativeBaselineCustomPath: string, modifiedFiles: Models.other.ModifiedFiles)
    : Models.other.ModifiedFiles {
    // console.log('relativeBaselineCustomPath', relativeBaselineCustomPath)

    //#region debug
    const isDebugMode = config.debug.baselineSiteJoin.DEBUG_MERGE_PATHES.includes(relativeBaselineCustomPath)

    if (isDebugMode) {
      Helpers.log(`[merge] ${_.times(5, () => '\n').join()}`)
      Helpers.log(`[merge] ${chalk.blue(`Baseline/Site modyfication detected...`)}`)
      Helpers.log(`[merge] File: ${relativeBaselineCustomPath}`)
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
      Helpers.log(`[merge] baselineAbsoluteLocation: ${baselineAbsoluteLocation}`)
      Helpers.log(`[merge] baselineFileInCustomPath ${baselineFileInCustomPath}`)
      Helpers.log(`[merge] joinFilePath ${joinFilePath}`)
    }
    //#endregion

    if (fse.existsSync(baselineFileInCustomPath)) {

      if (fse.existsSync(baselineAbsoluteLocation)) {
        variant = 'join'
        isDebugMode && Helpers.log(`[merge] ${variant}`)
        Helpers.copyFile(
          baselineAbsoluteLocation,
          HelpersMerge.getPrefixedPathInJoin(relativeBaselineCustomPath, this.project),
          { modifiedFiles }
        )
      } else {
        variant = 'no-in-baseline'
        isDebugMode && Helpers.log(`[merge] ${variant}`)
        Helpers.removeFileIfExists(
          HelpersMerge.getPrefixedPathInJoin(relativeBaselineCustomPath, this.project),
          { modifiedFiles }
        );
        // Helpers.log('after');
      }

      const replace = config.extensions.modificableByReplaceFn.includes(path.extname(baselineFileInCustomPath));
      const transformTextFn = replace ? this.replacePathFn(relativeBaselineCustomPath) : void 0;
      //#region debug
      if (isDebugMode) Helpers.log(`[merge] SOURCE: ${baselineFileInCustomPath} ,extname: ${path.extname(baselineFileInCustomPath)}`)
      if (isDebugMode) Helpers.log(`[merege] DEST: ${joinFilePath} ,extname: ${path.extname(joinFilePath)}`)
      if (isDebugMode) Helpers.log(`[merge] Replace fn for ${baselineFileInCustomPath} = ${!!transformTextFn}`)
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
        isDebugMode && Helpers.log(`[merge] ${variant}`)
        Helpers.copyFile(baselineAbsoluteLocation, joinFilePath, { fast: true, modifiedFiles });
        Helpers.removeFileIfExists(
          HelpersMerge.getPrefixedPathInJoin(relativeBaselineCustomPath, this.project),
          { modifiedFiles }
        );
      } else {
        variant = 'deleted'
        isDebugMode && Helpers.log(`[merge] ${variant}`)
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
      Helpers.log(`[merge] ${chalk.blueBright('Baseline/Site modyfication OK ')}, (action: ${variant}) `)
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
