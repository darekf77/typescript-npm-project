//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import { FeatureForProject } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from '../../../config';
import * as JSON5 from 'json5';

export class FilesTemplatesBuilder extends FeatureForProject {


  get files() {
    return this.project.filesTemplates();
  }
  rebuild() {
    const files = this.files;
    // Helpers.info(`Files templates for project:

    // ${files.map(f => f).join('\n')}

    // `);
    for (let index = 0; index < files.length; index++) {
      const f = files[index];
      const filePath = path.join(this.project.location, f);
      if (Helpers.exists(filePath)) {
        var fileContent = Helpers.readFile(filePath);
      }
      if (!fileContent) {
        Helpers.warn(`[filesTemplats][rebuild] Not able to read file: ${filePath}`);
        continue;
      }
      const env = ((this.project.env && this.project.env.config) ? this.project.env.config : {}) as any;
      // Helpers.log(`Started for ${f}`);
      this.processFile(filePath, fileContent, env, _);
      // Helpers.log(`Processed DONE for ${f}`);
    }
    this.project.quickFixes.updateTsconfigsInTmpSrcBrowserFolders();
  }

  rebuildFile(filetemplateRelativePath) {
    const filePath = path.join(this.project.location, filetemplateRelativePath);
    try {
      var fileContent = Helpers.readFile(filePath);
      if (!fileContent) {
        Helpers.warn(`[filesTemplats][rebuildFile] Not able to read file: ${filePath}`);
        return;
      }
    } catch (error) {
      Helpers.warn(`[filesTemplats][rebuildFile] Not able to read file: ${filePath}`);
      return;
    }
    const env = ((this.project.env && this.project.env.config) ? this.project.env.config : {}) as any;
    this.processFile(filePath, fileContent, env, _);
  }

  private processFile(
    orgFilePath: string,
    content: string,
    reservedExpSec: Models.env.EnvConfig,
    reservedExpOne: any) { // lodash
    const filePath = orgFilePath.replace(`.${config.filesExtensions.filetemplate}`, '');
    // Helpers.pressKeyAndContinue();
    let newContent = content
      .split('\n')
      .filter(line => !line.trimLeft().startsWith('#'))
      .map(line => {
        const matches = line.match(/\{\{\{.*\}\}\}/);
        if (_.isArray(matches)) {
          matches.forEach(pattern => {
            const expression = pattern.replace(/(\{|\})/g, '');
            // const reservedExpSec = ENV;
            // const reservedExpOne = _;
            // console.log('varssss: ', pattern)
            const exp = `(function(ENV,_){
              // console.log(typeof ENV)
              return ${expression.trim()}
            })(reservedExpSec,reservedExpOne)`;
            // console.log(exp)

            //     console.log(`Eval expre

            // ${exp}

            // `);

            try {
              const toReplace = eval(exp);
              line = line.replace(pattern, toReplace);
            } catch (err) {
              Helpers.error(`Error during filtemplate parse: ${orgFilePath}`, true, true);
              Helpers.error(err, false, true);
            }
            // console.log('toReplace', toReplace)
          });
        }
        return line;
      }).join('\n');

    Helpers.removeFileIfExists(filePath);
    if (filePath.endsWith('.json')) {
      try {
        const jsonparsed = JSON5.parse(newContent);
        newContent = JSON.stringify(jsonparsed, null, 2);
      } catch (e) {
        Helpers.log(e);
        Helpers.info(newContent);
        Helpers.error(`[filetemplate] Not able to parse new content` +
          ` for json in ${path.basename(filePath)}

          `, false, true);
      }
    }
    Helpers.writeFile(filePath, newContent);


    // if (!this.project.isCoreProject) {
    //   fse.unlinkSync(orgFilePath);
    // }

  }

}

//#endregion
