import { chokidar, crossPlatformPath, _, path } from 'tnp-core';
import { config } from 'tnp-config'
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { FeatureForProject } from '../../abstract';
import { folder_shared_folder_info } from '../../../constants';


export class AssetsFileListGenerator extends FeatureForProject {

  //#region fields & getters
  private targetProjectName: string;
  private outFolder: Models.dev.BuildDir;
  private websql: boolean;
  watchers: chokidar.FSWatcher[] = [];
  readonly filename = 'assets-list.json';
  private detectedFiles = [] as string[];

  get assetsFolder() {
    if (this.project.isSmartContainer) {
      // codete-ngrx-quick-start/main/src/assets/assets-for
      // return crossPlatformPath([
      //   this.project.location,
      //   this.outFolder,
      //   this.project.name,
      //   this.targetProjectName,
      //   config.folder.src,
      //   config.folder.assets,
      // ])
      return crossPlatformPath([
        this.project.location,
        this.outFolder,
        this.project.name,
        this.targetProjectName,
        `tmp-apps-for-${this.outFolder}${this.websql ? '-websql' : ''}`,
        this.targetProjectName,
        config.folder.src,
        config.folder.assets,
      ])
    }
    return crossPlatformPath([
      this.project.location,
      `tmp-apps-for-${this.outFolder}${this.websql ? '-websql' : ''}`,
      this.project.name,
      config.folder.src,
      config.folder.assets,
    ])
  }

  get srcPath() {
    return crossPlatformPath(path.dirname(this.assetsFolder))
  }

  //#endregion

  async start(targetProjectName: string, outFolder: Models.dev.BuildDir, websql: boolean) {
    this.targetProjectName = targetProjectName;
    this.outFolder = outFolder;
    this.websql = websql;
    const files = Helpers.filesFrom(this.assetsFolder, true).filter(f => !this.shoudBeIgnore(f))
    const assetsSrcFolder = this.srcPath;
    // console.log({
    //   files,
    //   assetsSrcFolder,
    // })

    this.detectedFiles = files.map(f => {
      const relative = f.replace(assetsSrcFolder, '');
      return relative;
    }).filter(f => this.allowedOnList(f))
    this.update()
  }

  update() {
    const assetsListFilePath = crossPlatformPath([this.assetsFolder, this.filename])
    Helpers.logInfo(`\nSAVING ASSETS LIST INTO: ${assetsListFilePath}`)
    Helpers.writeJson(assetsListFilePath, this.detectedFiles);
  }

  updateDebounce = _.debounce(() => {
    this.update()
  }, 1000)

  private readonly notAllowed = [
    "/assets/.gitkeep",
    "/assets/assets-list.json",
    "/assets/sql-wasm.wasm",
    "/assets",
  ]

  allowedOnList = (relativePath: string) => {
    return _.isUndefined(this.notAllowed.find(f => f === relativePath));
  }

  shoudBeIgnore = (filePathj) => {

    return crossPlatformPath(filePathj).includes(`/${config.folder.generated}/pwa`) ||
      crossPlatformPath(filePathj).includes(`/${folder_shared_folder_info}`)
    // shared_folder_info.txt
  };

  async startAndWatch(targetProjectName: string, outFolder: Models.dev.BuildDir, websql?: boolean) {
    await this.start(targetProjectName, outFolder, websql);
    const srcPath = this.srcPath;

    const watcher = chokidar.watch([this.assetsFolder, `${this.assetsFolder}/**/*.*`], {
      ignoreInitial: true,
      followSymlinks: false,
      ignorePermissionErrors: true,
      ignored: (filePath) => this.shoudBeIgnore(filePath),
    }).on('all', (event, f) => {
      f = crossPlatformPath(f);
      const relative = f.replace(srcPath, '');
      if (this.allowedOnList(f)) {
        if (event === 'add') {
          if (!this.detectedFiles.includes(relative)) {
            this.detectedFiles.push(relative);
            this.updateDebounce()
          }
        }
        if (event === 'unlink') {
          this.detectedFiles = this.detectedFiles.filter(f => f !== relative);
          this.updateDebounce()
        }
      }

    })
    this.watchers.push(watcher);
  }




}
