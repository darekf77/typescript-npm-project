import { Component, OnInit } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';


@Component({
  selector: 'app-formly-progressbar',
  template: `
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
  `,
  styles: [`
    :host {
      display: block;
      padding-bottom: 20px;
    }
  `]
})
export class FormlyProgressbardComponent extends FieldType implements OnInit {
  // constructor() { }

  action() {
    if (_.isFunction(this.field.templateOptions.action)) {
      this.field.templateOptions.action();
    }
  }

  ngOnInit() {
    if (!this.field.templateOptions.label) {
      this.field.templateOptions.label = 'button with action';
    }
  }

}

