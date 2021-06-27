//#region @backend
import { path, crossPlatformPath } from 'tnp-core'
import { _ } from 'tnp-core';
import { config } from 'tnp-config';
import { NodeModulesBase } from './node-modules-base.backend';
import { Helpers } from 'tnp-helpers';

export class NodeModules extends NodeModulesBase {

  get fixesForNodeModulesPackages() {
    const notAllowedNames = [
      'plugins',
      'scripts',
      'projects',
      'examples',
      'src',
      'components',
    ]

    return this.project
      .getFolders()
      .filter(f => {
        return !this.project.children.map(c => c.name).includes(path.basename(f)) &&
          !Helpers.values(config.tempFolders).includes(path.basename(f));
      })
      .map( f => crossPlatformPath(f) )
      .map(f => f.replace(this.project.location, '').replace(/^\//, ''))
      .filter(f => f.search('\/') === -1)
      .filter(f => !notAllowedNames.includes(f))
      ;
  }
}
//#endregion
