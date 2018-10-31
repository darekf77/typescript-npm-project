import * as _ from 'lodash';
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-item-build',
  templateUrl: './item-build.component.html',
  styleUrls: ['./item-build.component.scss']
})
export class ItemBuildComponent extends BaseItemStepperProcessBuildComponent implements OnInit {




  ngOnInit() {
    this.fields = [
      {

        type: 'iconbutton',
        templateOptions: {
          icon: 'play_arrow',
          // label: 'Start',
          action: async () => {
            await this.projectController.startBuildById(this.model.id).received;
            // log.i('build process started!');
          }
        },
        expressionProperties: {
          'templateOptions.disabled': () => {
            return !this.model || _.isNumber(this.model.pidServeProces);
          }
        },
        hideExpression: () => (!this.model ||
          _.isNumber(this.model.pidBuildProces) ||
          !!this.model.pidClearProces)
      },
      {

        type: 'iconbutton',
        templateOptions: {
          icon: 'stop',
          action: async () => {
            await this.projectController.stopBuildById(this.model.id).received;
            // log.i('build process stopped!')
          }
        },
        hideExpression: () => (!this.model ||
          !this.model.pidBuildProces ||
          !!this.model.pidClearProces)
      },
      {

        type: 'iconbutton',
        templateOptions: {
          icon: 'dvr',
          label: 'Logs',
          action: () => {
            // this.isShowingBuildLogs = true;
          }
        }
      },
      {
        type: 'iconbutton',
        templateOptions: {
          icon: 'refresh',
          action: async () => {
            // log.d('includeNodeModulesWhileClear', this.includeNodeModulesWhileClear)
            // await this.projectController.clearById(this.model.project.id).received
          }
        },

        expressionProperties: {
          'templateOptions.disabled': () => {
            return (this.model && (
              _.isNumber(this.model.pidClearProces) ||
              _.isNumber(this.model.pidBuildProces) ||
              _.isNumber(this.model.pidServeProces)
            ));
          },
          'templateOptions.label': () => {
            return (this.model && _.isNumber(this.model.pidClearProces)) ? 'is clearing... ' : 'Clear';
          }
        },
        hideExpression: () => (this.model && !!this.model.pidBuildProces)
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
  }

}
