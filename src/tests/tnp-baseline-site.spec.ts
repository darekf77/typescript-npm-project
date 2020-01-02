import { describe } from 'mocha';
import { expect, use } from 'chai';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { SpecWrap } from './_helpers.spec';
import { NEW, NEW_SITE } from '../scripts/NEW-PROJECT_FILES_MODULES/NEW.backend';
import { INIT, CLEAR_ALL } from '../scripts/PROJECTS-DEVELOPMENT/FILES_STRUCTURE';
import { Project } from '../project';
import { Helpers } from 'tnp-helpers';

const BASELINE_WORKSPACE_PROJECT_NAME = 'test-1'
const SITE_NAME = `site-for-${BASELINE_WORKSPACE_PROJECT_NAME}`;


class BaselinSiteJoinTest {

  baselinChild: Project;
  siteChild: Project;
  constructor(
    public baseline: Project,
    public site: Project,
    childProject?: string
  ) {
    if (childProject) {
      this.baselinChild = baseline.child(childProject);
      this.siteChild = site.child(childProject);
    }
  }
  static create(baseline: Project, site: Project, childProject?: string) {
    return {
      test(childProject: string) {
        return new BaselinSiteJoinTest(baseline, site, childProject)
      }
    }
  }



  scenario(contextFn: (context: BaselinSiteJoinTest) => void) {

    contextFn(this);

    return this;
  }

}


const wrap = SpecWrap.create();
describe(wrap.describe('Tnp Baseline Site'), async () => {


  await wrap.it(`should create baseline/site worksapces projects`,
    async (location, testName, { packageJSON, cwdChange }) => {
      global.muteMessages = true;
      NEW(`workspace ${BASELINE_WORKSPACE_PROJECT_NAME}`, false);
      NEW_SITE(`${SITE_NAME} --basedOn=${BASELINE_WORKSPACE_PROJECT_NAME}`, false)

      const project = {
        baseline: Project.From(path.join(location, BASELINE_WORKSPACE_PROJECT_NAME)),
        site: Project.From(path.join(location, SITE_NAME)),
      };

      const ins = BaselinSiteJoinTest.create(project.baseline, project.site);


      ins
        .test('isomorphic-lib')
        .scenario(ctx => {
          simpleContorllerJoin(ctx);
        })



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
        // console.log('sitePath', sitePath)
        const site = Project.From(sitePath)
        expect(site).to.not.be.undefined
        expect(site.isSite).to.be.true;

      })



    }, { removeTestFolder: false })


})



/**
 * Simple Baseline Site Join of isomorphic-lib controller
 */
function simpleContorllerJoin(ctx: BaselinSiteJoinTest) {
  const fileNameWithoutExt = _.upperFirst(_.camelCase(simpleContorllerJoin.name))
  const fileName = `${fileNameWithoutExt}.ts`
  const relative = `src/apps/user/${fileName}`;
  const relativeWithoutext = `src/apps/user/${fileNameWithoutExt}`;
  const filePathBaseline = ctx.baselinChild.path(relative);
  const filePathSite = ctx.siteChild.path(relative);

  ctx.baselinChild.filesFactory.createFile('src/helpers.ts', `
  export class Helpers {

  }
  `)
  ctx.baselinChild
    .filesFactory.createFile(filePathBaseline.relative.normal, `
import { Helpers } from 'tnp-helpers';

export class ${fileNameWithoutExt} {

}
        `);

  ctx.siteChild.filesFactory.createFile(filePathBaseline.relative.custom, `
import { ${fileNameWithoutExt} as Base } from '${ctx.baseline.name}/${ctx.baselinChild.name}/${relativeWithoutext}';
import {
Morphi
} from 'morphi';

export class ${fileNameWithoutExt} extends Base {

}
                `);

  describe(_.startCase(simpleContorllerJoin.name), () => {
    it('should have test file', async () => {
      // console.log('pathFile.normal', pathFile.normal)
      expect(ctx.siteChild.containsFile(filePathBaseline.relative.normal)).to.be.true;

      expect(ctx.siteChild.containsFile(filePathBaseline.relative.__prefixed)).to.be.true;
      expect(ctx.siteChild.containsFile(filePathBaseline.relative.custom)).to.be.true;
    })

    it('should change origin filepath to prefixed', async () => {
      expect(!!~Helpers.readFile(filePathSite.absolute.normal).toString().trim()
        .search(`import { ${fileNameWithoutExt} as Base } from './__${fileNameWithoutExt}';`)).to.be.true;
    });

    // it('should join new lines in import into one long import', async () => {
    //   expect(!!~Helpers.readFile(filePathSite.absolute.normal).toString().trim()
    //     .search(`import { Morphi } from 'morphi';`)).to.be.true;
    // });

  })


}
