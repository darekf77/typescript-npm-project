//#region angular
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
//#endregion

//#region isomorphic
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { TnpProjectTabIndex } from '../../tabs-menu-tnp-project';
//#endregion

@Component({
  selector: 'app-item-serve',
  templateUrl: './item-serve.component.html',
  styleUrls: ['./item-serve.component.scss']
})
export class ItemServeComponent extends BaseItemStepperProcessBuildComponent implements OnInit {

  tabSelectedAction() {

  }

  async formValueChanged() {

  }

  tabNumber() {
    return TnpProjectTabIndex.SERVE;
  }

  ngOnInit() {

  }

}
