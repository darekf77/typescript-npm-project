import { IncCompiler } from 'incremental-compiler';
import { config } from 'tnp-config';
import { Helpers, path } from 'tnp-core';
import { Models } from 'tnp-models';
import { FeatureCompilerForProject } from '../../abstract/feature-compiler-for-project.backend';
import type { Project } from '../../abstract/project/project';
import { RegionRemover } from '../build-isomorphic-lib/region-remover.backend';
const FIXED = '// @fixed';


function pathes(project: Project) { // TODO @LAST OPTIMIZE THIS
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

  constructor(public project: Project) {
    super(project, options(project));
  }

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    this.fix(event.fileAbsolutePath)
  }

  bases = [
    path.join(this.project.location, config.folder.dist),
    path.join(this.project.location, config.folder.bundle),
  ]

  fix(fileAbsolutePath: string) {
    if (Helpers.isFolder(fileAbsolutePath)) {
      return;
    }
    if (path.extname(fileAbsolutePath) !== '.js') {
      return;
    }

    for (let index = 0; index < this.bases.length; index++) {
      const baseOutfolder = this.bases[index];
      const base = path.join(baseOutfolder, config.folder.node_modules);
      if (fileAbsolutePath.startsWith(base)) {
        return;
      }
    }


    if (fileAbsolutePath.replace(path.join(this.project.location, config.folder.dist), '').startsWith(`/${config.folder.browser}/`)) {
      return;
    }
    if (fileAbsolutePath.replace(path.join(this.project.location, config.folder.dist), '').startsWith(`/${config.folder.client}/`)) {
      return;
    }
    if (fileAbsolutePath.replace(path.join(this.project.location, config.folder.bundle), '').startsWith(`/${config.folder.browser}/`)) {
      return;
    }
    if (fileAbsolutePath.replace(path.join(this.project.location, config.folder.bundle), '').startsWith(`/${config.folder.client}/`)) {
      return;
    }

    // const realPath = path.resolve(fileAbsolutePath);
    // if (realPath !== fileAbsolutePath) {
    //   return;
    // } sd

    const content = Helpers.readFile(fileAbsolutePath);
    if (content && !content.trimRight().endsWith(FIXED)) {
      const raw = RegionRemover.from(fileAbsolutePath, content, ['@browser' as any], this.project as Project);
      Helpers.writeFile(fileAbsolutePath, raw.output + '\n' + FIXED)
    }

  }


  async syncAction(absoluteFilePathes: string[]) {
    absoluteFilePathes.forEach(f => {
      this.fix(f);
    });
  }

}