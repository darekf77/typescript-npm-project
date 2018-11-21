import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// third part
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('building process')
// local
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { TnpProjectController } from 'ss-common-logic/browser/controllers/TnpProjectController';


@Component({
  selector: 'app-serving-process',
  templateUrl: './serving-process.component.html',
  styleUrls: ['./serving-process.component.scss']
})
export class ServingProcessComponent implements OnInit {

  constructor(
    public projectController: TnpProjectController
  ) { }

  fields = [
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'play_arrow',
        action: async () => {
          await this.projectController.startServeById(this.model.project.id).received
          log.i('serve process started!')
        },
      },
      expressionProperties: {
        'templateOptions.disabled': () => (!this.model ||
          !this.model.project ||
          !this.model.project.progress ||
          this.model.project.progress.value < 100)
      },
      hideExpression: () => (!this.model || _.isNumber(this.model.project.pidServeProces))
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'stop',
        action: async () => {
          await this.projectController.stopServeById(this.model.project.id).received
          log.i('serve process stopped!')
        }
      },
      hideExpression: () => (!this.model || !this.model.project.pidServeProces)
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'dvr',
        label: 'Logs',
        action: async () => {
          this.isShowingServeLogs = true;
        }
      }
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'screen_share',
        label: 'Display',
        // disabled: true,
        action: async () => {
          // window.open()
        }
      },
    }


  ] as FormlyFieldConfig[]

  textServeLogs = ''
  isShowingServeLogs = false;

  @Input() model: BUILD;



  ngOnInit() {
  }


  progress(p) {

  }


}
