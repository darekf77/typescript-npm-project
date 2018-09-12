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

@Component({
  selector: 'app-serving-process',
  templateUrl: './serving-process.component.html',
  styleUrls: ['./serving-process.component.scss']
})
export class ServingProcessComponent implements OnInit {

  fields = [
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'play_arrow',
        action: async () => {
          await this.buildController.startServeById(this.model.id).received
          this.refreshModel.emit()
          log.i('serve process started!')
        }
      },
      hideExpression: () => (!this.model || _.isNumber(this.model.pidServeProces))
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'stop',
        action: async () => {
          await this.buildController.stopServeById(this.model.id).received
          this.refreshModel.emit()
          log.i('serve process stopped!')
        }
      },
      hideExpression: () => (!this.model || !this.model.pidServeProces)
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'screen_share',
        label: 'Display',
        action: async () => {
          // window.open()
        }
      },
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

  ] as FormlyFieldConfig[]

  textServeLogs = ''
  isShowingServeLogs = false;

  @Input() model: BUILD;
  @Output() refreshModel = new EventEmitter();

  constructor(
    public buildController: BuildController
  ) { }

  ngOnInit() {
  }





}
