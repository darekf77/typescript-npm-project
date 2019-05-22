import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecWrap } from "./_helpers.spec";
import { NEW, NEW_SITE } from '../scripts/NEW';
import { INIT, CLEAR_ALL } from '../scripts/FILES_STRUCTURE';
import { Project } from '../project';

const BASELINE_WORKSPACE_PROJECT_NAME = 'test-1'
const SITE_NAME = `site-for-${BASELINE_WORKSPACE_PROJECT_NAME}`;


const wrap = SpecWrap.create();
describe(wrap.describe('Tnp Baseline Site'), async () => {


  await wrap.it(`should create baseline/site worksapces projects`,
    async (location, testName, { packageJSON, cwdChange }) => {

      NEW(`workspace ${BASELINE_WORKSPACE_PROJECT_NAME}`, false, location);
      NEW_SITE(`${SITE_NAME} --basedOn=${BASELINE_WORKSPACE_PROJECT_NAME}`, false, location)

      var project = {
        baseline: Project.From(path.join(location, BASELINE_WORKSPACE_PROJECT_NAME)),
        site: Project.From(path.join(location, SITE_NAME)),
        baseline_isomorphi_lib: Project.From(path.join(location, BASELINE_WORKSPACE_PROJECT_NAME)).child('isomorphic-lib'),
        site_isomorphi_lib: Project.From(path.join(location, SITE_NAME)).child('isomorphic-lib'),
      };

      var testFilePath = 'src/apps/user/UserController.ts';
      var testFilePathForSite = 'src/apps/user/__UserController.ts';
      var testFilePathCustom = 'custom/src/apps/user/UserController.ts';

      project.baseline_isomorphi_lib
        .filesFactory.createFile(testFilePath, `
export class UserController {

}
        `);

      project.site_isomorphi_lib
        .filesFactory.createFile(testFilePathCustom, `
import { UserController as Base } from '${BASELINE_WORKSPACE_PROJECT_NAME}/isomorphic-lib/${testFilePath}';

export class UserController extends Base {

}
        `);

      console.log('FILE CREATINTOINTOINOITNOTINasdasOI')

      it(testName, async () => {
        // await cwdChange(BASELINE_WORKSPACE_PROJECT_NAME, async () => {
        //   // await CLEAR_ALL('', false)
        //   await INIT(' --skipNodeModules --recrusive', false)
        // });
        await cwdChange(path.join(SITE_NAME, 'isomorphic-lib'), async () => {
          // await CLEAR_ALL('', false)
          await INIT(' --skipNodeModules', false)
        });
        const sitePath = path.join(location, SITE_NAME);
        console.log('sitePath', sitePath)
        const site = Project.From(sitePath)
        expect(site).to.not.be.undefined
        expect(site.isSite).to.be.true;

      })

      it('should have test file', async () => {
        expect(project.site_isomorphi_lib.containsFile(testFilePath)).to.be.true;
        expect(project.site_isomorphi_lib.containsFile(testFilePathCustom)).to.be.true;
        expect(project.site_isomorphi_lib.containsFile(testFilePathForSite)).to.be.true;
      })

    }, { removeTestFolder: false })


})
