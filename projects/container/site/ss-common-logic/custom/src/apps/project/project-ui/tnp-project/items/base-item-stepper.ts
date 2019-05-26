
import { Component, OnInit, Input } from '@angular/core';

import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { MatDialog } from '@angular/material';
import { PROJECT } from '../../../PROJECT';
import { BaseComponent } from 'baseline/ss-common-ui/components/helpers';

@Component({
  selector: 'app-base-item-stepper-process-build',
  template: ''
})
export class BaseItemStepperProcessBuildComponent extends BaseComponent implements OnInit {

  @Input() formGroup: FormGroup = new FormGroup({});
  @Input() model: PROJECT;

  fields: FormlyFieldConfig[];

  constructor(


    public matDialog: MatDialog) {
      super()
  }

  ngOnInit() { }

}
