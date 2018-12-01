import { BuildController } from "../controllers/BuildController";
import { Subject } from "rxjs/Subject";
import BUILD from "../entities/BUILD";
import { ModelDataConfig } from "morphi";
import { TNP_PROJECT } from "../entities/TNP_PROJECT";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/fromPromise';
@Injectable()
export class BuildService {

  constructor(
    private ctrl: BuildController) {

  }

  private async refreshModel(id: number, config: ModelDataConfig) {


    //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
    if (ENV.currentProjectName === 'ss-common-ui') {
      return mockBuild()
    }
    //#endregion

    const data = await this.ctrl.getBy(id, config ? config : undefined).received;
    return data.body.json;
  }

  private subject = new Subject<BUILD>();

  get $observe() {
    const self = this;
    return {
      byId(id: number, config: ModelDataConfig) {
        return from(self.refreshModel(id, config))
      }
    }
  }


}

export function from( promise:Promise<any> ) {
  const su
  return Observable.create()
}


//#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
function mockBuild() {
  const build = new BUILD();

  build.project = new TNP_PROJECT();
  build.project.name = 'Project1';
  build.project.isWorkspace = true;
  build.project.environments = ['dev', 'prod', 'stage']
  build.gitRemote = 'git@asdasdasd.asdasdas.git';

  const child1 = new TNP_PROJECT();
  child1.name = 'ChildProject1';

  const child2 = new TNP_PROJECT();
  child2.name = 'ChildPoroject2';

  const child2child1 = new TNP_PROJECT();
  child2child1.name = 'ChildPoroject2child1';

  const child2child2 = new TNP_PROJECT();
  child2child2.name = 'ChildPoroject2child2';

  child2.children = [
    child2child1,
    child2child2
  ];

  build.project.children = [
    child1, child2
  ];

  return build;
}
//#endregion
