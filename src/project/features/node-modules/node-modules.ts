//#region @backend
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import { config } from 'tnp-config';
import { NodeModulesBase } from './node-modules-base.backend';

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
          !_.values(config.tempFolders).includes(path.basename(f));
      })
      .map(f => f.replace(this.project.location, '').replace(/^\//, ''))
      .filter(f => f.search('\/') === -1)
      .filter(f => !notAllowedNames.includes(f))
      ;
  }
}
//#endregion
