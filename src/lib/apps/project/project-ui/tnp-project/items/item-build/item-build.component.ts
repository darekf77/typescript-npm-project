import { _ } from 'tnp-core';
import { Component, OnInit, Input } from '@angular/core';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';

import { PROJECT } from '../../../../PROJECT';
import { TnpProjectTabIndex } from '../../tabs-menu-tnp-project';


@Component({
  selector: 'app-item-build',
  templateUrl: './item-build.component.html',
  styleUrls: ['./item-build.component.scss']
})
export class ItemBuildComponent extends BaseItemStepperProcessBuildComponent implements OnInit {

  tabNumber() {
    return TnpProjectTabIndex.BUILD;
  }
  @Input() model: PROJECT;

  async formValueChanged() {

  }

  tabSelectedAction() {
    const proc = this.model.procStaticBuild;
    const parameters = _.isString(this.model.selectedEnv) ? { env: this.model.selectedEnv } : void 0;
    this.model.procStaticBuild.parameters = parameters

    // const COMMAND_TO_EXECUTE = proc.parameters ? Helpers
    //   .interpolateString(proc.cmd)
    //   .withParameters(proc.parameters)
    //   : proc.cmd;

    // proc.cmd = COMMAND_TO_EXECUTE;
  }


}
