import { FeatureForProject } from '../abstract';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as JSON5 from 'json5';
import * as glob from 'glob';
import * as rimraf from 'rimraf';


export class FilesFactory extends FeatureForProject {


  createFile(relativePath: string, content?: string | JSON) {
    const destPath = path.join(this.project.location, relativePath)
    if (_.isUndefined(content)) {
      content = '';
    }
    if (!fse.existsSync(path.dirname(destPath))) {
      fse.mkdirpSync(path.dirname(destPath))
    }
    if (_.isObject(content)) {
      fse.writeJSONSync(destPath, content, { encoding: 'utf8', spaces: 2 })
    } else {
      fse.writeFileSync(destPath, content ? content.toString() : '', { encoding: 'utf8' });
    }
  }

}
