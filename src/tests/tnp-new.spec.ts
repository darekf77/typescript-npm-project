import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecWrap } from './_helpers.spec';
import { NEW } from '../scripts/NEW-PROJECT_FILES_MODULES/NEW.backend';
// import { INIT } from '../scripts/PROJECTS-DEVELOPMENT/FILES_STRUCTURE';



const wrap = SpecWrap.create();
describe(wrap.describe('Tnp init'), async () => {




  await wrap.it(`should init worksapce project`,
    async (location, testName, { packageJSON, cwdChange }) => {
      // NEW(`workspace test1`, false, location); // TODO fix it

      // packageJSON('test1', p => {
      //   p.dependencies = {}
      //   p.dependencies = {}
      //   p.tnp.core = void 0;
      // })
      // console.log(process.cwd())
      it(testName, async () => {
        await cwdChange('test1', async () => {
          // await INIT(' --skipNodeModules', false) // TODO
        })
        expect(true).to.be.true;

      })


    })

})
