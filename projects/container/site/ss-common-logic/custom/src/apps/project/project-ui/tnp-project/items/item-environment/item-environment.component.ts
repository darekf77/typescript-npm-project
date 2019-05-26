import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { MatRadioChange } from '@angular/material/radio';
import { EnvironmentName } from 'tnp-bundle';


import { PROJECT } from '../../../../PROJECT';


import { Log, Level } from 'ng2-logger';
const log = Log.create('item-environment.componetn');

@Component({
  selector: 'app-item-environment',
  templateUrl: './item-environment.component.html',
  styleUrls: ['./item-environment.component.scss']
})
export class ItemEnvironmentComponent extends BaseItemStepperProcessBuildComponent implements OnInit {

  entity = PROJECT;
  async ngOnInit() {
    await this.model.updateEndGetEnvironments();
  }

  get data() {
    if (!this.model || !_.isArray(this.model.envionments)) {
      return void 0;
    }
    return this.model.envionments.map(env => {
      return {
        name: env, action: ({name}) => {
          this.model.selectedEnv = name;
          this.model.selectedIndex += 1;
        }
      }
    });
  }


}
