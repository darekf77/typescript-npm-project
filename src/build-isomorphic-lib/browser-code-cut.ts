import { CodeCut } from 'morphi/build';
import { ReplaceOptionsExtended } from './models';

export class ExtendedCodeCut extends CodeCut {

    constructor(protected cwd: string, filesPathes: string[], options: ReplaceOptionsExtended) {
        super(cwd, filesPathes, options as any);
    }


}



// //#region @backend
// import * as _ from 'lodash';
// import * as fs from 'fs';
// import * as fse from 'fs-extra';
// import { CodeTransform } from 'morphi/build-tool/isomorphic/code-transform';
// import { EnvConfig } from '../models';
// import { nearestProjectTo } from '../helpers';
// import { Project } from '../project';
// import config from '../config';

// export class CodeTransformExtended extends CodeTransform {

//   public static ENV: EnvConfig;
//   private findReplacements(stringContent: string, pattern, fun, ) {

//     const replacements = [];
//     // console.log('WORD is fun')
//     stringContent.split('\n').map(line => {
//       const value = line.substr(line.search(pattern) + pattern.length).trim();
//       // console.log('value: ' + value)
//       if (fun(value.replace(/(\'|\")/g, ''))) {
//         console.log('MATCH!: ' + value)
//         replacements.push(`${pattern}${value}\n`);
//       }
//     })
//     return replacements;
//   }

//   replaceRegionsWith(stringContent = '', replacementPatterns = [], replacement = '') {

//     if (replacementPatterns.length === 0) return stringContent;
//     let pattern = replacementPatterns.shift();
//     // console.log('replacementPatterns', replacementPatterns)
//     if (Array.isArray(pattern) && pattern.length === 2) {
//       const funOrString = pattern[1] as Function;
//       pattern = pattern[0] as string;
//       if (_.isFunction(funOrString)) {
//         const replacements = this.findReplacements(stringContent, pattern, funOrString);
//         return this.replaceRegionsWith(stringContent, replacementPatterns.concat(replacements));
//       } else {
//         replacement = funOrString as any;
//       }
//     }

//     stringContent = stringContent.replace(this.REGEX_REGION(pattern), replacement);
//     return this.replaceRegionsWith(stringContent, replacementPatterns);
//   }


//   protected rawContents: { [projectLibName: string]: string } = {};
//   replaceRegionsForIsomorphicLibWithEnvironment(ENV, projectLibName?: string) {
//     const isWithEnv = _.isObject(ENV);

//     if (_.isString(projectLibName)) {

//       this.rawContents[projectLibName] = this.replaceRegionsWith(this.rawContent, [

//         ["@backendFunc", `return undefined;`],
//         "@backend",

//         ["@cutExpression ", function (expression) {
//           return isWithEnv && eval(`(function(ENV){ ${expression} })(e)`);
//         }]

//       ], '')

//     }

//     this.rawContent = this.replaceRegionsWith(this.rawContent, [

//       ["@backendFunc", `return undefined;`],
//       "@backend",

//       ["@cutExpression ", function (expression) {
//         return isWithEnv && eval(`(function(ENV){ ${expression} })(e)`);
//       }]

//     ], '')
//     return this;
//   }

//   project: Project;

//   envForSpecyficEnvironment(angularLibProjectName) {
//     const res: EnvConfig = _.cloneDeep(CodeTransformExtended.ENV);
//     res.name = angularLibProjectName;
//     return res;
//   }

//   replaceRegionsForIsomorphicLib() {

//     this.rawContents = {};

//     if (!this.project) {
//       this.project = nearestProjectTo(this.filePath);
//     }

//     if (this.project && this.project.isWorkspaceChildProject) {
//       const angularLibs = this.project
//         .parent
//         .children
//         .filter(c => c.type === 'angular-lib')
//         .map(c => c.name)
//         .forEach(projectLibName => {
//           this.replaceRegionsForIsomorphicLibWithEnvironment(this.envForSpecyficEnvironment(projectLibName), projectLibName)
//         })
//     }

//     const e = CodeTransformExtended.ENV;
//     return this.replaceRegionsForIsomorphicLibWithEnvironment(CodeTransformExtended.ENV);
//   }

//   saveOrDelete() {
//     // console.log('saving ismoprhic file', this.filePath)
//     if (this.isEmpty) {
//       const deletePath = this.filePath;
//       // console.log(`Delete empty: ${deletePath}`)
//       fse.unlinkSync(deletePath)

//       Object.keys(this.rawContents).forEach(projectLibName => {
//         const p = this.filePath.replace(new RegExp(`/${this.project.name}/${config.folder.dist}/`),
//           `/${this.project.name}/tmp-src-for-${projectLibName}-${config.folder.browser}/`)
//         fse.unlinkSync(p)

//       })
//     } else {
//       // console.log(`Not empty: ${this.filePath}`)
//       fs.writeFileSync(this.filePath, this.rawContent, 'utf8');

//       Object.keys(this.rawContents).forEach(projectLibName => {
//         const p = this.filePath.replace(new RegExp(`/${this.project.name}/${config.folder.dist}/`),
//           `/${this.project.name}/tmp-src-for-${projectLibName}-${config.folder.browser}/`)
//         fs.writeFileSync(p, this.rawContents[projectLibName], 'utf8');

//       })

//     }



//   }

// }

// //#endregion
