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
    include: ['location', 'name', 'browser']
  });

  constructor(
    public popupService: AppPreviewPopupContentService,
    private ProjectController: ProjectController,

  ) { }


  @ViewChild('menu') menu: TemplateRef<any>;
  models: PROJECT[] = [];
  selected: PROJECT;


  async ngOnInit() {



    const projects = await PROJECT.getAll(this.config);

    // this.models = projects.filter(p => p.name === 'container');
    log.i('projects', projects);
    this.models = projects;

    this.distinct()

  }

  distinct() {
    const all = {};
    this.models.forEach(c => {
      all[c.location] = c;
    })
    log.i('all',all)
  }

  ngAfterContentInit() {
    this.popupService.setContent(this.menu, '/previewcomponents/buildtnpprocess');
  }

}
