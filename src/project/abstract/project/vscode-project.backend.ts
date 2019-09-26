import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as json5 from 'json5';

import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Morphi } from 'morphi';
import { Models } from '../../../models';
import { config } from '../../../config';

export abstract class VscodeProject {

  //#region @backend
  public recreateCodeWorkspace(this: Project) {
    if (!this.isWorkspace) {
      return;
    }
    const configSettings = {};

    try {
      const settings = json5.parse(Helpers.readFile(path.join(this.location, '.vscode', 'settings.json')));
      // console.log(settings)
      Object.keys(settings)
        .filter(key => {
          const start = key.startsWith('workbench');
          // console.log(`${key} ${start}`)
          return start;
        })
        .forEach(key => {
          configSettings[key] = settings[key];
        });
    } catch (err) {
      // console.log(err)
    }

    const distributionFolder = path.join(this.location, config.folder.dist);
    if (!fse.existsSync(distributionFolder)) {
      Helpers.mkdirp(distributionFolder);
    }
    configSettings['terminal.integrated.cwd'] = '.';

    const codeWorkspace = {
      folders: [
        { path: '.' },
        ...this.children
          .map(c => {
            return { path: c.name }
          }),
        { path: 'dist' }
      ],
      settings: configSettings
    };
    fse.writeJSONSync(path.join(this.location,
      this.nameOfCodeWorkspace), codeWorkspace, {
        encoding: 'utf8',
        spaces: 2
      });

  }

  get nameOfCodeWorkspace(this: Project) {
    return `tmp.code-workspace`;
  }

  openInVscode(this: Project) {
    this.recreateCodeWorkspace()
    if (this.isStandaloneProject || this.isUnknowNpmProject) {
      this.run(`code ${this.location}`).sync()
    } else {
      const isomorphicServers: Project[] = this.children.filter(c => c.type === 'isomorphic-lib');
      this.run(`code ${this.location}/${this.nameOfCodeWorkspace}`).sync();
      isomorphicServers.forEach(s => {
        s.run(`code ${s.location}`).sync()
      });
    }
  }

}
// export interface VscodeProject extends Partial<Project> { }
