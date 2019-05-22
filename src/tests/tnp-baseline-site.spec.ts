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

      NEW(`workspace ${BASELINE_WORKSPACE_PROJECT_NAME}`, false, location);
      NEW_SITE(`${SITE_NAME} --basedOn=${BASELINE_WORKSPACE_PROJECT_NAME}`, false, location)

      const project = {
        baseline: Project.From(path.join(location, BASELINE_WORKSPACE_PROJECT_NAME)),
        site: Project.From(path.join(location, SITE_NAME)),
      };

      const ins = BaselinSiteJoinTest.create(project.baseline, project.site);

      ins
        .test('isomorphic-lib')
        .scenario(ctx => {
          const fileNameWithoutExt = 'TestController'
          const fileName = `${fileNameWithoutExt}.ts`
          const relative = `src/apps/user/${fileName}`;
          const relativeWithoutext = `src/apps/user/${fileNameWithoutExt}`;
          const pathFile = ctx.baselinChild.getRelativeFilePath(relative);

          ctx.baselinChild
            .filesFactory.createFile(pathFile.normal, `
export class ${fileNameWithoutExt} {

}
        `);

          ctx.siteChild.filesFactory.createFile(pathFile.custom, `
import { ${fileNameWithoutExt} as Base } from '${ctx.baseline.name}/${ctx.baselinChild.name}/${relativeWithoutext}';

export class ${fileNameWithoutExt} extends Base {

}
                `);

          it('should have test file', async () => {
            console.log('pathFile.normal',pathFile.normal)
            expect(ctx.siteChild.containsFile(pathFile.normal)).to.be.true;

            expect(ctx.siteChild.containsFile(pathFile.__prefixed)).to.be.true;
            expect(ctx.siteChild.containsFile(pathFile.custom)).to.be.true;
          })

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
        console.log('sitePath', sitePath)
        const site = Project.From(sitePath)
        expect(site).to.not.be.undefined
        expect(site.isSite).to.be.true;

      })



    }, { removeTestFolder: false })


})
