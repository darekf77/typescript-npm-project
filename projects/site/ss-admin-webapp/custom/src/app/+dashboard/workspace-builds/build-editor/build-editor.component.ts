import { Component, OnInit, ViewChild, TemplateRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('build-editor')

import { ModelDataConfig } from 'morphi/browser';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// local
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';


@Component({
  selector: 'app-build-editor',
  templateUrl: './build-editor.component.html',
  styleUrls: ['./build-editor.component.scss']
})
export class BuildEditorComponent implements OnInit {

  modelDataConfig = new ModelDataConfig()
  id: number;


  constructor(
    public route: ActivatedRoute,
    private router: Router,
    private matDialog: MatDialog,
    private ngZone: NgZone,

    public buildController: BuildController
  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });


  }

  fields = [
    // {
    //   type: 'switch',
    //   templateOptions: {
    //     label: 'Git folder'
    //   }
    // }
  ] as FormlyFieldConfig[];

  private async refreshModel() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    const data = await this.buildController.getBy(this.id).received
    this.model = data.body.json;

    this.model.realtimeEntity.subscribe(
      (d) => {
        log.i('BUILD UPDATE FROM SOCKET', d)
        _.merge(this.model, d)
      }
    )
    log.i('REFRESHE and ACTIVATE for sockets model', this.model)


  }

  model: BUILD;

  async ngOnInit() {
    await this.refreshModel()
    await this.getProject()
  }

  complete() {

  }

  project: TNP_PROJECT;
  async getProject() {

    const data = await this.buildController.getProjectBy(this.model.id).received
    log.i('project', data.body.json)
    this.project = data.body.json;
  }


}
