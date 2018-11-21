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
import { TnpProjectController } from 'ss-common-logic/browser/controllers/TnpProjectController';
import { MatDialog, MatCheckboxChange } from '@angular/material';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { FormlyBuildTnpProcessComponent } from '../formly-build-tnp-process/formly-build-tnp-process.component';




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
      type: FormlyBuildTnpProcessComponent.typeName,
      templateOptions: {
        label: 'adasdasd'
      },
      key: 'asdasdaa'
    },
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
      expressionProperties: {
        'templateOptions.disabled': () => {
          return !this.model || !this.model.project || _.isNumber(this.model.project.pidServeProces)
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
          log.d('includeNodeModulesWhileClear', this.includeNodeModulesWhileClear)
          await this.projectController.clearById(this.model.project.id).received
        }
      },

      expressionProperties: {
        'templateOptions.disabled': () => {
          return (this.model && this.model.project && (
            _.isNumber(this.model.project.pidClearProces) ||
            _.isNumber(this.model.project.pidBuildProces) ||
            _.isNumber(this.model.project.pidServeProces)
          ))
        },
        'templateOptions.label': () => {
          return (this.model && _.isNumber(this.model.project.pidClearProces)) ? 'is clearing... ' : 'Clear';
        }
      },
      hideExpression: () => (this.model && !!this.model.project.pidBuildProces)
    },
    // {
    //   // name: 'includeNodeModulesWhileClear',
    //   type: 'checkbox',
    //   // defaultValue: false,
    //   templateOptions: {
    //     label: "include node modules",
    //     change: (e: MatCheckboxChange) => {
    //       this.includeNodeModulesWhileClear = e.checked
    //     }
    //   }
    // }
  ] as FormlyFieldConfig[];


  includeNodeModulesWhileClear = false;

  isShowingBuildLogs = false;

  @Input() model: BUILD;

  childresProjectsBuildsOrClearInProgress(p: TNP_PROJECT) {
    return p && _.isArray(p.children) &&
      p.children.filter(c => _.isNumber(c.pidBuildProces) || _.isNumber(c.pidClearProces)).length > 0
  }

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

  async rebuild(p: TNP_PROJECT) {
    await this.projectController.startBuildById(p.id).received
    p.realtimeEntity.subscribe(async () => {
      const data = await this.projectController.getBy(p.id).received
      log.d('update child entity', data.body.json)
      const project = data.body.json;
      _.merge(p, { pidBuildProces: project.pidBuildProces });
    })
  }

  async stopRebuild(p: TNP_PROJECT) {
    await this.projectController.stopBuildById(p.id).received
    p.realtimeEntity.unsubscribe()
  }

  ngOnInit() { }

  ngAfterViewInit() { }



}
