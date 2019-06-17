import { Component, OnInit, AfterContentInit, ViewChild, TemplateRef } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Log } from 'ng2-logger/browser';

const log = Log.create('privew build tnp ');
import { PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/PROJECT';

import { ModelDataConfig } from 'morphi/browser';
import { AppPreviewPopupContentService } from 'baseline/ss-common-ui/src/app/app-popup-content.service';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { BaseComponentForRouter } from 'baseline/ss-common-ui/components/helpers/base-component';
console.log('asd')

@Component({
  selector: 'app-preview-buildtnpprocess',
  templateUrl: './preview-buildtnpprocess.component.html',
  styleUrls: ['./preview-buildtnpprocess.component.scss']
})
export class PreviewBuildtnpprocessComponent extends BaseComponentForRouter
  implements OnInit, AfterContentInit {


  config = new ModelDataConfig({
    // include: ['location', 'name', 'browser']
  });

  constructor(
    public popupService: AppPreviewPopupContentService,
    public router: Router,
    public activeRoute: ActivatedRoute,
    // private ProjectController: ProjectController,

  ) {
    super(router);
    this.reloadNgOninitOnUrlChange()
  }


  @ViewChild('menu') menu: TemplateRef<any>;
  projects: PROJECT[] = []
  selected: PROJECT;

  filter = {
    props: ['isStandaloneProject'],
    values: [true],
    levels: [0]
  }


  async ngOnInit() {

    log.d('[nginit] this.isCalledNgInitAfterInternalRefresh()', this.isCalledNgInitAfterInternalRefresh())

    if (!this.isCalledNgInitAfterInternalRefresh()) {
      const projects = await PROJECT.getAllForMenu();
      log.i('[nginit] projects', projects);
      this.projects = projects;
    }

    // this.models = projects.filter(p => p.name === 'container');


    let { projectLocation } = this.router.routerState.snapshot.root.queryParams;
    log.i('[nginit] projectLocation', projectLocation)
    if (_.isString(projectLocation)) {
      projectLocation = decodeURIComponent(projectLocation);
      const selected = this.projects.find(p => p.location === projectLocation);
      if (selected) {
        this.selected = selected;
        await selected.updaetAndGetProceses()
      }
      log.i('[nginit] this.selected', this.selected)
    }

  }

  async selectProject(project: PROJECT) {
    log.i('project ot update', project.name)
    this.router.navigate([], {
      queryParams: {
        projectLocation: encodeURIComponent(project.location)
      },
      relativeTo: this.activeRoute
    });

  }

  // distinct() {
  //   const all = {};
  //   this.models.forEach(c => {
  //     all[c.location] = c;
  //   })
  //   log.i('all',all)
  // }

  ngAfterContentInit() {
    this.popupService.setContent(this.menu, '/previewcomponents/buildtnpprocess');
  }

}
