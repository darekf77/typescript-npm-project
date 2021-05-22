import { describe } from 'mocha';
import { expect, use } from 'chai';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';

import { SpecWrap } from './_helpers.spec';
import { NEW } from '../scripts/NEW-PROJECT_FILES_MODULES/NEW.backend';
import { $INSTALL as INSTALL } from '../scripts/DEPENDENCIES-MANAGEMENT/DEPS.backend';



const wrap = SpecWrap.create();
describe(wrap.describe('Tnp install'), async () => {




  await wrap.it(`should install worksapce packages`,
    async (location, testName, { packageJSON, cwdChange }) => {
      NEW(`isomorphic-lib test1`, false, location);

      packageJSON('test1', p => {
        p.dependencies = {}
        p.dependencies = {}
        p.tnp.core = void 0;
      })
      // console.log(process.cwd())

      Helpers.mkdirp(path.join(location, 'test1', 'node_modules', '.bin'))

      it(testName, async () => {
        await cwdChange('test1', async () => {
          INSTALL('lodash', false)
        })
        expect(true).to.be.true;

      })


    })

})
