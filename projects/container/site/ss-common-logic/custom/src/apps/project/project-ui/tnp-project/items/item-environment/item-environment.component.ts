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

  public data = [];
  tabNumber() {
    return 0;
  }

  async formValueChanged() {
    if (this.model.selectedEnv) {
      setTimeout(() => {
        this.model.selectedIndex += 1;
      })
    }
  }

  async tabSelectedAction() {
    this.model.selectedEnv = void 0;
    await this.model.updateEndGetEnvironments();
    if (this.model.procStaticBuild.state !== 'notStarted') {
      this.model.selectedIndex += 1;
    }
    this.data = this.environments;
  }
  entity = PROJECT;

  get environments() {
    if (!this.model || !_.isArray(this.model.envionments)) {
      return [];
    }
    return this.model.envionments
      .filter(env => env !== 'local')
      .map(env => {
        return {
          name: env, action: ({ name }) => {
            // setTimeout(() => {
            this.model.selectedEnv = name;
            this.cd.detectChanges()
            // })

          }
        }
      })
  }


}
