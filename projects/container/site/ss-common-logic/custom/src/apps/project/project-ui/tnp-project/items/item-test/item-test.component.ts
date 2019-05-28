import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';


import { PROJECT } from '../../../../PROJECT';


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
    return void 0;
  }
  ngOnInit() {
  }

}
