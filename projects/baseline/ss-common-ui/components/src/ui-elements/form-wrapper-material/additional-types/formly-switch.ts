import { Component, OnInit } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
const log = Log.create('formly switch');

@Component({
  selector: 'app-formly-switch',
  template: `
     <mat-slide-toggle [checked]="formControl.value" (change)="change($event)"  >Slide me!</mat-slide-toggle>
  `,
  styles: [`
    :host {
      padding-bottom: 20px;
    }
  `]
})
export class FormlySwitchComponent extends FieldType implements OnInit {

  value: boolean;

  change(e: MatSlideToggleChange) {
    this.formControl.setValue(e.checked);
  }

  ngOnInit() {
    if (_.isUndefined(this.field.defaultValue)) {
      this.field.defaultValue = false;
    }

    if (!this.field.templateOptions.label) {
      this.field.templateOptions.label = 'button with action';
    }
  }

}

