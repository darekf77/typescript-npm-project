//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';

import { IsomoprhicBuild } from 'morphi/build-tool/isomorphic/build'
import { BuildOptions } from 'morphi/build-tool/isomorphic/models'
import { IncrementalBuildExtended } from './incremental';
import { CodeTransformExtended } from './isomorphic-code-transform';

export class IsomoprhicBuildExtended extends IsomoprhicBuild {

  incrementalBuildClass = IncrementalBuildExtended;
  CodeTransform = CodeTransformExtended;

  init(processCWD) {

    if (_.isString(this.BUILD.environmentFileName)) {
      const envConfigPath = path.join(processCWD, this.BUILD.environmentFileName);
      if (fs.existsSync(envConfigPath)) {
        try {
          CodeTransformExtended.ENV = fse.readJsonSync(envConfigPath, { encoding: 'utf8' })
          // console.log(`Project with environment file: ${this.BUILD.environmentFileName}`,this.CodeTransform.ENV)
        } catch (error) {
          console.warn(`Wrong environment file in ${envConfigPath}`)
        }
      }
    }


    super.init(processCWD)
  }

}


//#endregion
