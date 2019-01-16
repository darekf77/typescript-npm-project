import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TNP_PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/entities/TNP_PROJECT';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';

@Component({
  selector: 'app-item-test',
  templateUrl: './item-test.component.html',
  styleUrls: ['./item-test.component.scss']
})
export class ItemTestComponent  extends BaseItemStepperProcessBuildComponent  implements OnInit {


  ngOnInit() {
  }

}
