import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecWrap } from './_helpers.spec';
import { NEW } from '../scripts/NEW';
import { INSTALL } from '../scripts/INSTALL';



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
