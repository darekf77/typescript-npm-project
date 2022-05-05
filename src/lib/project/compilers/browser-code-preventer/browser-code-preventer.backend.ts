import { IncCompiler } from 'incremental-compiler';
import { config } from 'tnp-config';
import { crossPlatformPath, glob, Helpers, path, _ } from 'tnp-core';
import { Models } from 'tnp-models';
import { FeatureCompilerForProject } from '../../abstract/feature-compiler-for-project.backend';
import type { Project } from '../../abstract/project/project';
import { RegionRemover } from '../build-isomorphic-lib/region-remover.backend';
const FIXED = '/* @fixed */ ';
const MAP_VERSION = '{"version"';
const MAP_FIXED = `{"fixed":true,"version"`;


function pathes(project: Project) { // TODO  OPTIMIZE THIS
  const pattern = ''
  return [
    path.join(project.location, config.folder.dist) + pattern,
    path.join(project.location, config.folder.bundle) + pattern,
  ];
}

export function options(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  let folderPath: string | string[] = void 0;

  if (project.typeIs('isomorphic-lib') && project.frameworkVersionAtLeast('v3')) {
    folderPath = pathes(project);
    folderPath.forEach(f => { // TODO QUICK_FIX
      if (!Helpers.exists(f)) {
        if (path.extname(f) !== '') {
          Helpers.mkdirp(f);
        } else {
          Helpers.writeFile(f, '');
        }
      }
    })
  }

  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath,
    notifyOnFileUnlink: true,
  };
  return options;
}

/**
 * Thanks to this I can easly
 * remove code that belong only to backend
 * from dist or bundle
 */
@IncCompiler.Class({ className: 'BrowserCodePreventer' })
export class BrowserCodePreventer extends FeatureCompilerForProject {

  readonly isSmartContainerTarget: boolean = false;
  constructor(public project: Project) {
    super(project, options(project));
    this.isSmartContainerTarget = project.isSmartContainerTarget;
  }

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    // Helpers.info(`async action for ${event.fileAbsolutePath}`)
    this.fix(event.fileAbsolutePath)
  }

  bases = [
    path.join(this.project.location, config.folder.dist),
    path.join(this.project.location, config.folder.bundle),
  ]

  runForFolder(folderPath: Models.dev.BuildDir) {
    const folder = `${path.join(this.project.location, folderPath)}/**/*.*`;
    const files = glob.sync(folder);
    // console.log('folder', files)
    files.forEach(f => {
      this.fix(f);
    })
  }

  fix(fileAbsolutePath: string) {

    fileAbsolutePath = crossPlatformPath(fileAbsolutePath);
    if (Helpers.isFolder(fileAbsolutePath)) {
      return;
    }

    // if (path.basename(path.dirname(fileAbsolutePath)) === config.folder.node_modules) {
    //   return;
    // }
    // if (path.basename(path.dirname(path.dirname(fileAbsolutePath))) === config.folder.node_modules) {
    //   return;
    // }
    // if (path.basename(path.dirname(path.dirname(path.dirname(fileAbsolutePath)))) === config.folder.node_modules) {
    //   return;
    // }

    const isMapFile = (this.isSmartContainerTarget && fileAbsolutePath.endsWith('.js.map'));

    if (path.extname(fileAbsolutePath) !== '.js' && !isMapFile) {
      return;
    }


    // console.log('checking', fileAbsolutePath)

    for (let index = 0; index < this.bases.length; index++) {
      const baseOutfolder = this.bases[index];
      const base = crossPlatformPath(path.join(baseOutfolder, config.folder.node_modules));
      if (fileAbsolutePath.startsWith(base)) {
        return;
      }
    }


    if (fileAbsolutePath.replace(crossPlatformPath(path.join(this.project.location, config.folder.dist)), '')
      .startsWith(`/${config.folder.browser}/`)) {
      return;
    }
    if (fileAbsolutePath.replace(crossPlatformPath(path.join(this.project.location, config.folder.dist)), '')
      .startsWith(`/${config.folder.client}/`)) {
      return;
    }
    if (fileAbsolutePath.replace(crossPlatformPath(path.join(this.project.location, config.folder.bundle)), '')
      .startsWith(`/${config.folder.browser}/`)) {
      return;
    }
    if (fileAbsolutePath.replace(crossPlatformPath(path.join(this.project.location, config.folder.bundle)), '')
      .startsWith(`/${config.folder.client}/`)) {
      return;
    }

    // const realPath = path.resolve(fileAbsolutePath);
    // if (realPath !== fileAbsolutePath) {
    //   return;
    // } sd

    // console.log('fixing try: ', fileAbsolutePath)

    const content = Helpers.readFile(fileAbsolutePath);

    if (isMapFile) {
      if (content && !content.trimLeft().startsWith(MAP_FIXED)) {
        let jsonMap: { sources: string[] } = JSON.parse(content);
        const source = _.first(jsonMap.sources);
        const [backPath, libPath] = source.split('/src/');
        const splitedLibPath = libPath.split('/');
        const folderOrFIle = _.first(splitedLibPath);
        const newBackPath = path.join(backPath, '../../..');
        let target = this.project.name;
        let back: string = _.first(jsonMap.sources);
        if (['lib', 'app', 'app.ts'].includes(folderOrFIle)) {
          back = path.join(newBackPath, target, config.folder.src, libPath);
        }
        if (folderOrFIle === 'libs') {
          target = splitedLibPath[1];
          back = path.join(newBackPath, target, config.folder.src, splitedLibPath.slice(1).join('/'));
        }
        jsonMap.sources = [back];
        Helpers.writeFile(fileAbsolutePath, JSON.stringify(jsonMap).replace(MAP_VERSION, MAP_FIXED));
        // console.log(`FIXED MAP: ${fileAbsolutePath}`)
      }
    } else {
      if (content
        && !content.trimLeft().startsWith(FIXED)
        && !content.trimLeft().startsWith('#') // do not fix bash files - windows issue
      ) {
        let raw = content;

        let removeNext = 0;
        raw = raw.split('\n').map((l, i) => {
          if (removeNext > 0) {
            removeNext--;
            return Models.label.browserCode;
          }
          if (l.search('@browser' + 'Import') !== -1) { // TODO QUCK_FIX regex for comment
            removeNext = 2;
            return Models.label.browserCode;
          }

          if (l.search('@browser' + 'Export') !== -1) { // TODO QUCK_FIX regex for comment
            removeNext = 2;
            return Models.label.browserCode;
          }

          if (l.search('@browser' + 'Line') !== -1) { // TODO QUCK_FIX regex for comment
            removeNext = 1;
            return Models.label.browserCode;
          }
          return l;
        }).join('\n')

        // console.log('fixing', fileAbsolutePath)
        // @ts-ignore
        raw = RegionRemover.from(fileAbsolutePath, raw, ['@browser'], this.project as Project).output;
        Helpers.writeFile(fileAbsolutePath, FIXED + raw)
      }
    }




  }


  async syncAction(absoluteFilePathes: string[]) {
    Helpers.info('fixing @browser code started...')
    absoluteFilePathes.forEach(f => {
      this.fix(f);
    });
    Helpers.info('fixing @browser code.. done')
  }

}
