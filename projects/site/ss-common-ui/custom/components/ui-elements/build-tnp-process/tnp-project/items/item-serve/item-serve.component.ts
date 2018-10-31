import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { MatRadioChange } from '@angular/material/radio';


@Component({
  selector: 'app-item-serve',
  templateUrl: './item-serve.component.html',
  styleUrls: ['./item-serve.component.scss']
})
export class ItemServeComponent extends BaseItemStepperProcessBuildComponent implements OnInit {

  ngOnInit() {
    
  }

}
