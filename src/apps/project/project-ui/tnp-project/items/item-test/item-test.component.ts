//#region angular
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
//#endregion

//#region isomorphic
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { TnpProjectTabIndex } from '../../tabs-menu-tnp-project';
//#endregion


@Component({
  selector: 'app-item-test',
  templateUrl: './item-test.component.html',
  styleUrls: ['./item-test.component.scss']
})
export class ItemTestComponent  extends BaseItemStepperProcessBuildComponent  implements OnInit {


  tabSelectedAction() {

  }


  async formValueChanged() {

  }

  tabNumber() {
    return TnpProjectTabIndex.TEST;
  }
  ngOnInit() {
  }

}
