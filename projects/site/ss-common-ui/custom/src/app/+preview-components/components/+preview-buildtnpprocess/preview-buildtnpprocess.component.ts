import { Component, OnInit } from '@angular/core';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { TNP_PROJECT_STATE, TNP_PROJECT_ACTION } from './ngxs-test';


@Component({
  selector: 'app-preview-buildtnpprocess',
  templateUrl: './preview-buildtnpprocess.component.html',
  styleUrls: ['./preview-buildtnpprocess.component.scss']
})
export class PreviewBuildtnpprocessComponent implements OnInit {

  model: string = ''

  mod() {
    let p = new TNP_PROJECT();
    p.name = this.model;
    return p;
  }

  add() {
    console.log(this.model);
    this.store.dispatch(new TNP_PROJECT_ACTION.AddProject(this.mod()))
  }

  @Select(TNP_PROJECT_STATE.getProject) projects$: Observable<TNP_PROJECT[]>;

  constructor(
    private store: Store
  ) { }

  // model: BUILD;

  ngOnInit() {

    // this.$projects = this.store.select( s => s. )

    // const build = new BUILD();

    // build.project = new TNP_PROJECT();
    // build.project.name = 'Project1';
    // build.project.isWorkspace = true;
    // build.project.environments = ['dev', 'prod', 'stage']
    // build.gitRemote = 'git@asdasdasd.asdasdas.git';

    // const child1 = new TNP_PROJECT();
    // child1.name = 'ChildProject1';

    // const child2 = new TNP_PROJECT();
    // child2.name = 'ChildPoroject2';

    // const child2child1 = new TNP_PROJECT();
    // child2child1.name = 'ChildPoroject2child1';

    // const child2child2 = new TNP_PROJECT();
    // child2child2.name = 'ChildPoroject2child2';

    // child2.children = [
    //   child2child1,
    //   child2child2
    // ];

    // build.project.children = [
    //   child1, child2
    // ];

    // this.model = build;
  }

}
