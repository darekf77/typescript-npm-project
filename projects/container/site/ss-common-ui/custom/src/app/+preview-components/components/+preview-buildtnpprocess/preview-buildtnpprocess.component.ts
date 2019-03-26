import { Component, OnInit, AfterContentInit, ViewChild, TemplateRef } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Log } from 'ng2-logger/browser';

const log = Log.create('privew build tnp ');
import { PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/PROJECT';
import { ProjectController } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/ProjectController';
import { ModelDataConfig } from 'morphi/browser';
import { AppPreviewPopupContentService } from 'baseline/ss-common-ui/src/app/app-popup-content.service';

@Component({
  selector: 'app-preview-buildtnpprocess',
  templateUrl: './preview-buildtnpprocess.component.html',
  styleUrls: ['./preview-buildtnpprocess.component.scss']
})
export class PreviewBuildtnpprocessComponent
  implements OnInit, AfterContentInit {


  config = new ModelDataConfig({
    // include: ['location', 'name', 'browser']
  });

  constructor(
    public popupService: AppPreviewPopupContentService,
    private ProjectController: ProjectController,

  ) { }


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

    // this.distinct()

  }

  async selectProject(project: PROJECT) {

    const fullProject = await PROJECT.getByLocation(project.location);
    this.models[this.models.indexOf(project)] = fullProject;
    this.selected = fullProject;
    log.i('full porject', project)
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
