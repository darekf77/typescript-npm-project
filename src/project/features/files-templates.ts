//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import { FeatureForProject } from '../abstract';
import { EnvConfig } from '../../models';
import { warn } from '../../helpers';
import config from '../../config';

export class FilesTemplatesBuilder extends FeatureForProject {


  get files() {
    return this.project.filesTemplates();
  }
  rebuild() {

    this.files.forEach(f => {
      const filePath = path.join(this.project.location, f);
      try {
        var fileContent = fse.existsSync(filePath) ? fse.readFileSync(filePath, {
          encoding: 'utf8'
        }) : void 0
        if (!fileContent) {
          warn(`[filesTemplats] Not able to read file: ${filePath}`);
          return;
        }
      } catch (error) {
        warn(`[filesTemplats] Not able to read file: ${filePath}`);
        return;
      }
      const env = this.project.isWorkspaceChildProject ? this.project.env.config : void 0;
      this.processFile(filePath, fileContent, env);
    });

  }

  private processFile(orgFilePath: string, content: string, ENV: EnvConfig) {
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
            const toReplace = eval(exp);
            line = line.replace(pattern, toReplace);
            // console.log('toReplace', toReplace)
          });
        }
        return line;
      }).join('\n');
    fse.writeFileSync(filePath, newContent, {
      encoding: 'utf8'
    });

  }

}

//#endregion
