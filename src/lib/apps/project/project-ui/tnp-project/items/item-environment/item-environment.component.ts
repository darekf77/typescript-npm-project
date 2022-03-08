import { Component, OnInit, Input } from '@angular/core';
import { _ } from 'tnp-core';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { PROJECT } from '../../../../PROJECT';
import { Log, Level } from 'ng2-logger';
import { TnpProjectTabIndex } from '../../tabs-menu-tnp-project';
const log = Log.create('item-environment.componetn');

@Component({
  selector: 'app-item-environment',
  templateUrl: './item-environment.component.html',
  styleUrls: ['./item-environment.component.scss']
})
export class ItemEnvironmentComponent extends BaseItemStepperProcessBuildComponent implements OnInit {

  public data = [];
  tabNumber() {
    return TnpProjectTabIndex.ENV;
  }

  async formValueChanged() {

    // if (this.model.selectedEnv) {
    //   setTimeout(() => {
    //     this.model.selectedIndex += 1;
    //   })
    // }
  }

  async tabSelectedAction() {
    await this.model.updateEndGetEnvironments();
    // if (this.model.procStaticBuild.state !== 'notStarted' ||
    //   (_.isString(this.model.selectedEnv) && this.model.envionments.includes(this.model.selectedEnv as any))
    // ) {
    //   setTimeout(() => {
    //     this.model.selectedIndex += 1;
    //   })
    // }
    this.data = this.environments;
  }
  entity = PROJECT;

  get environments() {
    if (!this.model || !_.isArray(this.model.envionments)) {
      return [];
    }
    return this.model.envionments
      // .filter(env => env !== 'local')
      .map(env => {
        return {
          name: env, action: ({ name }) => {
            setTimeout(() => {
              this.model.selectedEnv = name;
              this.model.selectedIndex = TnpProjectTabIndex.BUILD;
              this.cd.detectChanges();
            });
          }
        }
      })
  }


}
