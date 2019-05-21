import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecWrap } from "./_helpers.spec";
import { NEW, NEW_SITE } from '../scripts/NEW';
import { INIT } from '../scripts/FILES_STRUCTURE';
import { Project } from '../project';

const BASELINE_WORKSPACE_PROJECT_NAME = 'test-1'
const SITE_NAME = `site-for-${BASELINE_WORKSPACE_PROJECT_NAME}`;


const wrap = SpecWrap.create();
describe(wrap.describe('Tnp Baseline Site'), async () => {




  await wrap.it(`should create baseline/site worksapces projects`,
    async (location, testName, { packageJSON, cwdChange }) => {
      NEW(`workspace ${BASELINE_WORKSPACE_PROJECT_NAME}`, false, location);
      NEW_SITE(`${SITE_NAME} --basedOn=${BASELINE_WORKSPACE_PROJECT_NAME}`, false, location)

      it(testName, async () => {
        await cwdChange(BASELINE_WORKSPACE_PROJECT_NAME, async () => {
          await INIT(' --skipNodeModules', false)
        })
        await cwdChange(SITE_NAME, async () => {
          await INIT(' --skipNodeModules', false)
        })
        const sitePath = path.join(location, SITE_NAME);
        console.log('sitePath',sitePath)
        const site = Project.From(sitePath)
        expect(site).to.not.be.undefined
        expect(site.isSite).to.be.true;
      })
    })


})
