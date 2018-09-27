import { Component, OnInit, Input, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// third part
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('building process')
import { Global } from 'morphi/browser'
// local
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { TnpProjectController } from 'ss-common-logic/browser/controllers/TnpProjectController';
import { MatDialog } from '@angular/material';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';



@Component({
  selector: 'app-building-process',
  templateUrl: './building-process.component.html',
  styleUrls: ['./building-process.component.scss']
})
export class BuildingProcessComponent implements OnInit, AfterViewInit {

  constructor(
    public projectController: TnpProjectController,

    public matDialog: MatDialog

  ) { }



  fields = [


    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'play_arrow',
        // label: 'Start',
        action: async () => {
          await this.projectController.startBuildById(this.model.project.id).received
          log.i('build process started!')
        }
      },
      hideExpression: () => (!this.model ||
        _.isNumber(this.model.project.pidBuildProces) ||
        !!this.model.project.pidClearProces)
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'stop',
        action: async () => {
          await this.projectController.stopBuildById(this.model.project.id).received
          log.i('build process stopped!')
        }
      },
      hideExpression: () => (!this.model ||
        !this.model.project.pidBuildProces ||
        !!this.model.project.pidClearProces)
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'dvr',
        label: 'Logs',
        action: () => {
          this.isShowingBuildLogs = true;
        }
      }
    },
    {
      type: 'iconbutton',
      templateOptions: {
        icon: 'refresh',
        action: async () => {
          this.projectController.clearById(this.model.project.id).received.observable.subscribe(async () => {
            log.i('CLEAR COMPLETE')
          })
        }
      },
      expressionProperties: {
        'templateOptions.disabled': () => {
          return (this.model && _.isNumber(this.model.project.pidClearProces))
        },
        'templateOptions.label': () => {
          return (this.model && _.isNumber(this.model.project.pidClearProces)) ? 'is clearing... ' : 'Clear';
        }
      },
      hideExpression: () => (this.model && !!this.model.project.pidBuildProces)
    }
  ] as FormlyFieldConfig[];


  isShowingBuildLogs = false;

  @Input() model: BUILD;

  get project(): TNP_PROJECT {
    return this.model && this.model.project;
  }

  get progress() {
    return (this.model && this.model.project.progress);
  }

  get info() {
    if (this.progress) {
      if (this.progress.status === 'error') {
        return `<strong class="color-red" >${this.progress.info}</strong>`
      } else if (this.progress.status === 'complete') {
        return `<strong class="color-green" >${this.progress.info}</strong>`
      } else if (this.progress.status === 'inprogress') {
        return `<span class="color-blue" >${this.progress.info}</span>`
      }
    }
    return `
      <span class="color-muted"   >  -- process not stated -- </span>
    `
  }



  ngOnInit() { }

  ngAfterViewInit() { }



}
