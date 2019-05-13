import * as _ from 'lodash';
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseItemStepperProcessBuildComponent } from '../base-item-stepper';
import { FormlyFieldConfig } from '@ngx-formly/core';


import { PROJECT } from '../../../../PROJECT';


@Component({
  selector: 'app-item-build',
  templateUrl: './item-build.component.html',
  styleUrls: ['./item-build.component.scss']
})
export class ItemBuildComponent extends BaseItemStepperProcessBuildComponent implements OnInit {


  @Input() model: PROJECT;

  ngOnInit() {
    this.fields = [
      {

      }
    ] as FormlyFieldConfig[];

  }

}
