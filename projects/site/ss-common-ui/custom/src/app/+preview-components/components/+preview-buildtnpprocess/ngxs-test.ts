
import { NgxsModule, Select, Selector } from '@ngxs/store'
import { Action, State, StateContext } from '@ngxs/store'
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin'
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin'



import { Observable } from 'rxjs/Observable';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';


export namespace TNP_PROJECT_ACTION {

  export class RunBuild {

    static readonly type = '[TNP_PROJECT] Feed Animals';

    constructor() {

    }

  }

  export class AddProject {

    static readonly type = '[TNP_PROJECT] Add Project';

    constructor(public project: TNP_PROJECT) {

    }

  }

}

interface TNP_PROJECT_STATE_MODEL {

  myProject: TNP_PROJECT;

  superProjects: TNP_PROJECT[];
  dupa?: string;

}


@State<TNP_PROJECT_STATE_MODEL>({
  name: 'TNP_PROJECT_STATE',
  defaults: {
    myProject: null,
    superProjects: []
  }
})
export class TNP_PROJECT_STATE {

  @Selector()
  static getProject(state: TNP_PROJECT_STATE_MODEL) {
    return state.superProjects;
  }

  @Action(TNP_PROJECT_ACTION.AddProject)
  add({ patchState, dispatch, getState, setState }: StateContext<TNP_PROJECT_STATE_MODEL>,
    action: TNP_PROJECT_ACTION.AddProject) {

    const projects = getState().superProjects;
    patchState({
      superProjects: [...projects, action.project]
    })

  }


  @Action(TNP_PROJECT_ACTION.RunBuild)
  runBUild(
    { patchState, dispatch, getState, setState }: StateContext<TNP_PROJECT_STATE_MODEL>,
    action: TNP_PROJECT_ACTION.RunBuild) {

    patchState({
      dupa: 'isPending'
    })


  }

}
