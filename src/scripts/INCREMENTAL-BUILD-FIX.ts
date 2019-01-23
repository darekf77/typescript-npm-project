// import * as path from 'path'
// import * as glob from 'glob';
// import * as fs from 'fs';
// import * as fse from 'fs-extra';
// import * as rimraf from 'rimraf';
// import { watch } from 'chokidar'

// import { IncrementalCompilation } from 'morphi/build'
// import { Project } from '../project';
// import { config } from '../config';
// import { Helpers } from '../helpers';
// import { Messages } from '../messages';

// class ExtensionCompilation {
//   files: string[] = [];
//   protected syncAction(): void {
//     const files = glob.sync(`dist/**/*.js`, { cwd: this.project.location })

//     files.forEach(f => {
//       const p = path.join(this.project.location, f)
//       this.files.push(Helpers.crossPlatofrmPath(p))
//       this.cb({ path: p, contents: fs.readFileSync(p, { encoding: 'utf8' }) });
//     })
//   }

//   protected preAsyncAction(): void {
//     watch(`src`, {
//       followSymlinks: false,
//       atomic: true
//     })
//       .on('change', this.callBackWithRelativePath('changed'))
//       .on('change', this.callBackWithRelativePath('rename'))
//       .on('add', this.callBackWithRelativePath('created'))
//       .on('unlink', this.callBackWithRelativePath('removed'))

//   }

//   callBackWithRelativePath(event) {
//     const self = this;
//     return function (relativePath: string) {
//       relativePath = Helpers.crossPlatofrmPath(relativePath)
//       if (event !== 'removed') {
//         self.asyncAction(path.join(self.project.location,
//           relativePath
//             .replace(/^src/, config.folder.dist)
//             .replace(/\.ts/, '.js')
//             ,
//         ))
//       }
//       // console.log(`eventt: ${event}`, p)
//     }
//   }

//   private asycActionInProgress = false;
//   protected asyncAction(filePath: string) {

//     if (this.files.includes(Helpers.crossPlatofrmPath(filePath))) {
//       this.files = this.files.filter(f => f !== Helpers.crossPlatofrmPath(filePath))
//       return
//     }
//     if (this.asycActionInProgress) {
//       return
//     }

//     this.asycActionInProgress = true
//     setTimeout(() => {
//       this.cb({ path: filePath, contents: fs.readFileSync(filePath, { encoding: 'utf8' }) });
//       this.asycActionInProgress = false;
//     }, 500)
//   }



//   cb(file: { contents: string, path: string; }) {
//     const absolutePath = Helpers.crossPlatofrmPath(file.path);
//     const relativePath = absolutePath.replace(Helpers.crossPlatofrmPath(path.join(this.project.location, config.folder.dist)), '')
//     const destinationPath = path.join(this.pathInExtNodeMod, relativePath);

//     if (!fse.existsSync(path.dirname(destinationPath))) {
//       fse.mkdirpSync(path.dirname(destinationPath))
//     }

//     fse.writeFileSync(destinationPath, file.contents, 'utf8')
//     fse.copyFileSync(file.path.replace(/\.js$/, '.js.map'), destinationPath.replace(/\.js$/, '.js.map'))
//     fse.copyFileSync(file.path.replace(/\.js$/, '.d.ts'), destinationPath.replace(/\.js$/, '.d.ts'))
//   }

//   get pathInExtNodeMod() {
//     return path.join(this.extensionProjectNodeModulesLocation, this.projectName);
//   }

//   cleanAndGeneratePackage() {
//     if (!fse.existsSync(this.pathInExtNodeMod)) {
//       fse.mkdirpSync(this.pathInExtNodeMod)
//       fse.writeJSONSync(path.join(this.pathInExtNodeMod, config.file.package_json),
//         {
//           name: this.projectName,
//           version: this.project.version
//         }, {
//           spaces: 2,
//           encoding: 'utf8'
//         })
//     } else {
//       rimraf.sync(`${this.pathInExtNodeMod}/**/*.js`);
//     }
//   }

//   init(taskName: string) {
//     Messages.log(`Start ${taskName}`)
//     this.syncAction()
//     Messages.info(`Finish (sync) ${taskName}`)
//   }

//   initAndWatch(taskName: string) {
//     this.init(taskName)
//     this.preAsyncAction()
//   }

//   constructor(
//     public project: Project,
//     public extensionProjectNodeModulesLocation: string,
//     public projectName: string
//   ) {

//     this.cleanAndGeneratePackage()
//   }
// }

// function Instance() {
//   return new ExtensionCompilation(Project.Current,
//     path.join(Project.Current.location, '..', 'navi-vscode-ext', config.folder.node_modules),
//     'navi'
//   );
// }

// export function DEVELOP_EXT() {
//   Instance().init('build of navi-cli')
//   process.exit(0)
// }

// export function DEVELOP_EXT_WATCH() {
//   Instance().initAndWatch('watch build of navi-cli')

// }
// console.log('dd')
// export default {

//   DEVELOP_EXT,
//   DEVELOP_EXT_WATCH
// }
