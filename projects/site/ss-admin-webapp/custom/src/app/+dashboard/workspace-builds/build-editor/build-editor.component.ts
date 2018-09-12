import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('build-editor', Level.__NOTHING)
import { ModelDataConfig } from 'morphi/browser';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// local
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';


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

    const data = await this.buildController.getBy(this.id, this.modelDataConfig).received

    log.i('current build id ', this.id)
    this.model = data.body.json;
    log.i('model', this.model)
  }

  model: BUILD;

  async ngOnInit() {
    await this.refreshModel()
  }

  complete() {

  }

}
