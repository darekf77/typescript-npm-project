import * as _ from 'lodash';
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Helpers } from 'baseline/ss-common-logic/src/helpers';

import { PROJECT } from '../../../../PROJECT';


@Component({
  selector: 'app-item-build',
  templateUrl: './item-build.component.html',
  styleUrls: ['./item-build.component.scss']
})
export class ItemBuildComponent extends BaseItemStepperProcessBuildComponent implements OnInit {


  @Input() model: PROJECT;

  ngOnInit() {

    this.handlers.push(this.model.selectedTabChanged.subscribe(tabNum => {
      if (tabNum === 1) {
        const proc = this.model.procStaticBuild;
        const parameters = _.isString(this.model.selectedEnv) ? { env: this.model.selectedEnv } : void 0;
        this.model.procStaticBuild.parameters = parameters

        const COMMAND_TO_EXECUTE = proc.parameters ? Helpers
          .interpolateString(proc.cmd)
          .withParameters(proc.parameters)
          : proc.cmd;

        proc.cmd = COMMAND_TO_EXECUTE;

      }
    }))
  }

}
