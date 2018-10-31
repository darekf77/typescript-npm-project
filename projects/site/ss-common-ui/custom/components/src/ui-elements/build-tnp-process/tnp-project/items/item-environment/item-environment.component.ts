import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { MatRadioChange } from '@angular/material/radio';


@Component({
  selector: 'app-item-environment',
  templateUrl: './item-environment.component.html',
  styleUrls: ['./item-environment.component.scss']
})
export class ItemEnvironmentComponent extends BaseItemStepperProcessBuildComponent implements OnInit {


  ngOnInit() {
    this.fields = [
      {
        key: 'environmentName',
        type: 'radio',
        templateOptions: {
          // label: 'Radio',
          placeholder: 'Environment',
          // description: 'Description',
          // required: true,
          options: [],
          change: async (field, change: MatRadioChange) => {
            // log.i('environment changed to: ', change.value)
            // const data = await this.buildController.changeEnvironment(this.model.id, change.value).received;
            // this.model.pidChangeEnvProces = data.body.json.project.pidChangeEnvProces;
          }
        },
        expressionProperties: {
          'templateOptions.disabled': () => {
            return !this.model || _.isNumber(this.model.pidChangeEnvProces);
          }
        }
      },
    ];
  }

}
