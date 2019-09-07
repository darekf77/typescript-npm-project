//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import { FeatureForProject } from '../../abstract';
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { config } from '../../../config';

export class FilesTemplatesBuilder extends FeatureForProject {


  get files() {
    return this.project.filesTemplates();
  }
  rebuild() {

    this.files.forEach(f => {
      const filePath = path.join(this.project.location, f);
      try {
        var fileContent =  Helpers.readFile(filePath);
        if (!fileContent) {
          Helpers.warn(`[filesTemplats] Not able to read file: ${filePath}`);
          return;
        }
      } catch (error) {
        Helpers.warn(`[filesTemplats] Not able to read file: ${filePath}`);
        return;
      }
      const env = this.project.isWorkspaceChildProject ? this.project.env.config : void 0;
      this.processFile(filePath, fileContent, env);
    });

  }

  private processFile(orgFilePath: string, content: string, ENV: Models.env.EnvConfig) {
    const filePath = orgFilePath.replace(`.${config.filesExtensions.filetemplate}`, '');

    const newContent = content
      .split('\n')
      .map(line => {
        const matches = line.match(/\{\{\{.*\}\}\}/);
        if (_.isArray(matches)) {
          matches.forEach(pattern => {
            const expression = pattern.replace(/(\{|\})/g, '');
            const e = ENV;
            // console.log('varssss: ', pattern)
            const exp = `(function(ENV){
              // console.log(typeof ENV)
              return ${expression.trim()}
            })(e)`;
            // console.log(exp)
            try {
              const toReplace = eval(exp);
              line = line.replace(pattern, toReplace);
            } catch (err) {
              Helpers.error(err, false, true);
            }
            // console.log('toReplace', toReplace)
          });
        }
        return line;
      }).join('\n');
    Helpers.writeFile(filePath, newContent);

  }

}

//#endregion
