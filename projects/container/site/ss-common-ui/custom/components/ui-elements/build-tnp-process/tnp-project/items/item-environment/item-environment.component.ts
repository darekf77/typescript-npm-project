import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { MatRadioChange } from '@angular/material/radio';
import { EnvironmentName } from 'tnp-bundle/browser';

import { ProjectController } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/ProjectController';
import { PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/PROJECT';


import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('item-environment.componetn');

@Component({
  selector: 'app-item-environment',
  templateUrl: './item-environment.component.html',
  styleUrls: ['./item-environment.component.scss']
})
export class ItemEnvironmentComponent extends BaseItemStepperProcessBuildComponent implements OnInit {

  entity = PROJECT;
  async ngOnInit() {


  }




}
