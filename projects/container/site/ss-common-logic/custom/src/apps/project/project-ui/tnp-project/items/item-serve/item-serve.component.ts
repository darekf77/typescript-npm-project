import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { MatRadioChange } from '@angular/material/radio';


import { PROJECT } from '../../../../PROJECT';


@Component({
  selector: 'app-item-serve',
  templateUrl: './item-serve.component.html',
  styleUrls: ['./item-serve.component.scss']
})
export class ItemServeComponent extends BaseItemStepperProcessBuildComponent implements OnInit {

  ngOnInit() {

  }

}
