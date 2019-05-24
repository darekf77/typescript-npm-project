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
  models: PROJECT[] = [];
  selected: PROJECT;

  filter = {
    props: ['isStandaloneProject'],
    values: [true],
    levels: [0]
  }


  async ngOnInit() {



    const projects = await PROJECT.getAllForMenu()

    // this.models = projects.filter(p => p.name === 'container');
    log.i('projects', projects);
    this.models = projects;

    let { projectLocation } = this.router.routerState.snapshot.root.queryParams;
    if (_.isString(projectLocation)) {
      projectLocation = decodeURIComponent(projectLocation);
      const selected = projects.find(p => p.location === projectLocation);
      if (selected) {
        this.selected = selected;
        await selected.updaetAndGetProceses()
      }
      // log.i('set from query params', projectLocation)
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
