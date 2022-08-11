//#region @backend
import {
  _,
  path,
  fse,
  rimraf,
  crossPlatformPath,
} from 'tnp-core';
import { CodeCut } from '../code-cut/browser-code-cut';
import { IncCompiler } from 'incremental-compiler';
import { config, ConfigModels } from 'tnp-config';
import { MorphiHelpers } from 'morphi';
import { Helpers } from 'tnp-helpers';
import { BackendCompilation } from './compilation-backend';

@IncCompiler.Class({ className: 'BroswerCompilation' })
export class BroswerCompilation extends BackendCompilation {

  public get compilationFolderPath() {
    if (_.isString(this.sourceOutBrowser) && _.isString(this.cwd)) {
      return crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser));
    }
  }
  compilerName = 'Browser standard compiler'

  public codecut: CodeCut;
  constructor(
    /**
     * Relative path for browser temporary src
     * Ex.   tmp-src-dist-browser
     */
    public sourceOutBrowser: string,
    outFolder: ConfigModels.OutFolder,
    location: string,
    cwd: string,
    public backendOutFolder: string,
    private customCompiler?: string
  ) {
    super(outFolder, location, cwd)
  }

  async syncAction(files: string[]) {
    // console.log('[compilation browser] syncAction', files)
    if (fse.existsSync(this.compilationFolderPath)) {
      rimraf.sync(this.compilationFolderPath)
    }
    fse.mkdirpSync(this.compilationFolderPath)
    const dereference = true; // Copy symlinks as normal files
    // console.log(`copying ${path.join(this.cwd, this.location)}/ to  ${this.compilationFolderPath} dereference: ${dereference},`)

    // TODO_NOT_IMPORTANT this may be replaced by filesPathes
    MorphiHelpers.System.Operations.tryCopyFrom(`${crossPlatformPath(path.join(this.cwd, this.location))}/`, this.compilationFolderPath, {
      dereference,
      filter: (src: string, dest: string) => {
        return copyToBrowserSrcCodition(src);
      }
    })
    // console.log('browser', this.filesAndFoldesRelativePathes.slice(0, 5))

    this.initCodeCut(files)
    // tsconfig.browser.json
    const source = crossPlatformPath(path.join(this.cwd, this.tsConfigBrowserName));
    const dest = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, this.tsConfigName));

    fse.copyFileSync(source, dest);
    this.codecut.files();
    await this.compile();
  }

  initCodeCut(filesPathes: string[]) {
    filesPathes = filesPathes.map(f => {
      f = crossPlatformPath(f);
      return f.replace(crossPlatformPath(path.join(this.cwd, this.location)), '').replace(/^\//, '');
    })
    this.codecut = new CodeCut(this.compilationFolderPath, filesPathes, {
      replacements: [
        ["@backendFunc",
          `return undefined;
`],
        "@backend"
      ]
    })
  }


  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    // console.log(`[compilation-browser][asyncAction] ${event.eventName} ${event.fileAbsolutePath}`)
    const absoluteFilePath = crossPlatformPath(event.fileAbsolutePath);
    const relativeFilePath = absoluteFilePath.replace(crossPlatformPath(path.join(this.cwd, this.location)), '');
    const destinationFilePath = crossPlatformPath(path.join(
      this.cwd,
      this.sourceOutBrowser,
      relativeFilePath,
    ));
    const destinationFileBackendPath = crossPlatformPath(path.join(
      this.cwd,
      this.sourceOutBrowser.replace('tmp-src', 'tmp-source'),
      relativeFilePath
    ));


    if (event.eventName === 'unlinkDir') {
      // console.log('REMOVING DIR', destinationFilePath)
      // console.log('REMOVING DIR BACKEND', destinationFileBackendPath)
      Helpers.removeFolderIfExists(destinationFilePath);
      Helpers.removeFolderIfExists(destinationFileBackendPath);
    } else {
      // noting here for backend

      // console.log('this.cwd', this.cwd)
      // console.log('this.sourceOutBrowser', this.sourceOutBrowser)
      // console.log('destinationFilePath', destinationFilePath)
      // console.log(`[asyncAction][${config.frameworkName}][cb] relativeFilePath: ${relativeFilePath}`)
      // console.log(`[asyncAction][${config.frameworkName}][cb] destinationFilePath: ${destinationFilePath}`);
      if (copyToBrowserSrcCodition(absoluteFilePath)) {
        if (event.eventName === 'unlink') {
          if (fse.existsSync(destinationFilePath)) {
            fse.unlinkSync(destinationFilePath)
          }
          if (fse.existsSync(destinationFileBackendPath)) {
            fse.unlinkSync(destinationFileBackendPath)
          }

          // console.log('unlink browser', destinationFilePath);
          // console.log('unlink backend', destinationFileBackendPath);

          // if (['module', 'component']
          //   .map(c => `.${c}.ts`)
          //   .filter(c => destinationFilePath.endsWith(c)).length > 0) {
          //   const orgFil = `${destinationFilePath}.orginal`;
          //   if (fse.existsSync(orgFil)) {
          //     fse.unlinkSync(orgFil)
          //   }
          // }
        } else {
          if (fse.existsSync(absoluteFilePath)) {

            if (!fse.existsSync(path.dirname(destinationFilePath))) {
              fse.mkdirpSync(path.dirname(destinationFilePath));
            }
            if (!fse.existsSync(path.dirname(destinationFileBackendPath))) {
              fse.mkdirpSync(path.dirname(destinationFileBackendPath));
            }

            if (fse.existsSync(destinationFilePath) && fse.lstatSync(destinationFilePath).isDirectory()) {
              fse.removeSync(destinationFilePath);
            }
            if (fse.existsSync(destinationFileBackendPath) && fse.lstatSync(destinationFileBackendPath).isDirectory()) {
              fse.removeSync(destinationFileBackendPath);
            }

            fse.copyFileSync(absoluteFilePath, destinationFilePath);
          }
        }
        this.codecut.file(destinationFilePath);
      }
    }

  }

  async compile(watch = false) {
    await this.libCompilation({
      cwd: this.compilationFolderPath,
      watch,
      outDir: (`../${this.backendOutFolder}/${this.outFolder}` as any),
      generateDeclarations: true,
      tsExe: this.customCompiler ? this.customCompiler : void 0,
      locationOfMainProject: this.cwd,
      isBrowserBuild: true,
      buildType: this.backendOutFolder as any
    });
  }

}

function copyToBrowserSrcCodition(absoluteFilePath: string) {
  return !absoluteFilePath.endsWith('.spec.ts')
  // && !absoluteFilePath.endsWith('.backend.ts');
}

//#endregion
