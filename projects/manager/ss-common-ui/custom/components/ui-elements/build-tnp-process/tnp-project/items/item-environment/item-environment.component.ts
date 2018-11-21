import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { MatRadioChange } from '@angular/material/radio';
import { EnvironmentName } from 'tnp-bundle/browser';

import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('item-environment.componetn');

@Component({
  selector: 'app-item-environment',
  templateUrl: './item-environment.component.html',
  styleUrls: ['./item-environment.component.scss']
})
export class ItemEnvironmentComponent extends BaseItemStepperProcessBuildComponent implements OnInit {


  async ngOnInit() {

    const envField = {
      // key: 'environmentName',
      // type: 'radio',
      // templateOptions: {
      //   // label: 'Radio',
      //   placeholder: 'Environment',
      //   // description: 'Description',
      //   required: true,
      //   options: [],
      //   change: async (field, change: MatRadioChange) => {
      //     log.i('environment changed to: ', change.value);
      //     const data = await this.projectController.changeEnvironment(this.model.id, change.value).received;
      //     this.model.pidChangeEnvProces = data.body.json.pidChangeEnvProces;
      //   }
      // },
      // expressionProperties: {
      //   'templateOptions.disabled': () => {
      //     return !this.model || _.isNumber(this.model.pidChangeEnvProces);
      //   }
      // }
    };

    this.fields = [
      // envField
    ];

    // const options = await this.projectController.b getEnvironmentNames();
    // envField.templateOptions.options = options.map(o => {
    //   return { value: o, label: _.startCase(o) };
    // });


  }




}
