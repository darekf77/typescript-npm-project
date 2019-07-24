import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecWrap } from "./_helpers.spec";
import { NEW } from '../scripts/NEW';
import { LibType } from '../models';
import config from '../config';
import { Project } from '../project';

const wrap = SpecWrap.create();
describe(wrap.describe('Tnp copy project'), async () => {




  await wrap.it('should have defined location',
    (location, testName, { }) => {
      it(testName, () => {
        expect(location).to.not.be.undefined;

      })
    })

  const libTypesToTest = [
    'isomorphic-lib',
    // 'angular-lib',
    'workspace'
  ] as LibType[];

  for (let index = 0; index < libTypesToTest.length; index++) {
    const libTypeName = libTypesToTest[index];
    await wrap.it(`should genrate copy project new project ${libTypeName} with new`,
      (location, testName, { }) => {

        const projectType: LibType = libTypeName;
        const projectName = `test-copy-${projectType}`;

        Project.by(libTypeName).copyManager.generateSourceCopyIn(path.join(location, projectName));
        // console.log('location'+location)
        it(testName, () => {


          expect(fse.existsSync(path.join(location, projectName))).to.be.true;
          expect(fse.existsSync(path.join(location, projectName, config.file.package_json))).to.be.true;

        })

      })
  }



});
