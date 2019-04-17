import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecHelper } from "./_helpers.spec";
import { NEW } from '../scripts/NEW';
import { LibType } from '../models';
import config from '../config';


describe('Ports set tests', async () => {




  await SpecHelper.it('should have defined location',
    async (location) => {
      console.log('location', location)

      expect(location).to.not.be.undefined;

    })

  const libTypesToTest = ['isomorphic-lib', 'angular-lib', 'workspace'] as LibType[];

  for (let index = 0; index < libTypesToTest.length; index++) {
    const libTypeName = libTypesToTest[index];
    await SpecHelper.it(`should crete new project ${libTypeName} with new`,
      async (location) => {

        const projectType: LibType = libTypeName;
        const projectName = `test-${projectType}`;
        NEW(`${projectType} ${projectName}`, false, location);
        expect(fse.existsSync(path.join(location, projectName))).to.be.true;
        expect(fse.existsSync(path.join(location, projectName, config.file.package_json))).to.be.true;


        const packageJSON = fse.readJSONSync(path.join(location, projectName, config.file.package_json));
        expect(packageJSON.name).to.be.eq(_.kebabCase(projectName))

      })
  }







});
