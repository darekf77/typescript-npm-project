//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';

import { Project, FeatureForProject } from '../abstract';
import { error, log, tryRemoveDir, HelpersLinks } from '../../helpers';
import { config } from '../../config';

export class WorkspaceSymlinks extends FeatureForProject {

  private get linkInside() {
    const projectsToLink: Project[] = []
      .concat(this.project.children)
      .concat(this.project.baseline ? [this.project.baseline] : [])

    projectsToLink.forEach(c => {
      if (path.basename(c.location) != c.name) {
        error(`Project "${c.location}" has different packaage.json name`
          + ` property than his own folder name "${path.basename(c.location)}"`)
      }
    })

    return projectsToLink;
  }

  remove(triggeredMsg: string) {
    this.linkInside.forEach(c => {
      const symPkgPath = path.join(this.project.location, config.folder.node_modules, c.name);
      if (fse.existsSync(symPkgPath)) {
        log(`Removing symlinks: ${c.genericName} from node_module ${triggeredMsg}`)
        fse.unlinkSync(symPkgPath);
      }
    })
    this.project.children.forEach(c => {
      log(`Remove child node_modules ${c.genericName} ${triggeredMsg}`)
      c.node_modules.remove()
    })
  }

  add(triggeredMsg: string) {
    this.linkInside.forEach(c => {
      const destination = path.join(this.project.location, config.folder.node_modules);
      log(`Adding symlinks: ${c.genericName} to node_module ${triggeredMsg}`)
      HelpersLinks.createSymLink(c.location, `${destination}/`)
    })
    this.project.children.forEach(c => {
      log(`Add parent '${this.project.genericName}' node_modules to child: ${c.name} ${triggeredMsg}`)
      this.project.node_modules.linkToProject(c)
    })
    this.project.children.forEach(c => {
      log(`Add parent '${this.project.genericName}' node_modules to child: ${c.name} ${triggeredMsg}`)
      this.project.node_modules.linkToProject(c)
    })
  }


}
//#endregion
