//#region @backend
import { path, crossPlatformPath } from 'tnp-core/src'
import { _ } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import { NodeModulesBase } from './node-modules-base.backend';
import { Helpers } from 'tnp-helpers/src';

export class NodeModules extends NodeModulesBase {

  get fixesForNodeModulesPackages() {
    // const notAllowedNames = [
    //   'plugins',
    //   'scripts',
    //   'projects',
    //   'examples',
    //   'src',
    //   'components',
    //   'solutions',
    // ]

    const patterns = this.project.__packageJson.data.tnp.overrided['npmFixes'];
    return patterns || [];
    // return this.project
    //   .getFolders()
    //   .filter(f => {
    //     return !this.project.children.map(c => c.name).includes(path.basename(f)) &&
    //       !Helpers.values(config.tempFolders).includes(path.basename(f));
    //   })
    //   .map( f => crossPlatformPath(f) )
    //   .map(f => f.replace(this.project.location, '').replace(/^\//, ''))
    //   .filter(f => f.search('\/') === -1)
    //   .filter(f => !notAllowedNames.includes(f))
    //   ;
  }
}
//#endregion
