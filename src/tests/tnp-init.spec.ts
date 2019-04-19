import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecWrap } from "./_helpers.spec";
import { NEW } from '../scripts/NEW';
import { INIT } from '../scripts/INIT';



const wrap = SpecWrap.create();
describe(wrap.describe('Tnp init'), async () => {




  await wrap.it(`should init worksapce project`,
    async (location, testName, { packageJSON }) => {
      NEW(`workspace test1`, false, location);

      // packageJSON('test1', p => {
      //   p.dependencies = {}
      //   p.dependencies = {}
      //   p.tnp.core = void 0;
      // })
      console.log(process.cwd())
      // await INIT('', false)

      it(testName, async () => {
        expect(true).to.be.true;

      })


    })

})
