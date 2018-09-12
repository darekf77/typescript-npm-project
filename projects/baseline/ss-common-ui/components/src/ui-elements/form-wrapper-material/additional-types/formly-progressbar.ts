import { Component, OnInit, AfterViewInit } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('formly progressbar')

import { ProgressBarStatus, ProgressBarType, ProgressBarData } from 'ss-common-logic/src/entities/PROGRESS_BAR';

@Component({
  selector: 'app-formly-progressbar',
  template: `

      <h6>
        <span *ngIf="field && field.templateOptions && field.templateOptions.label"> {{ field.templateOptions.label }} </span>
        <span [innerHTML]="info"></span>
      </h6>
      <mat-progress-bar mode="determinate" value="{{ field.templateOptions['value'] && field.templateOptions['value'].value }}" > </mat-progress-bar>
        `,
  styles: [`
    : host {

      padding-bottom: 20px;
      display: block;


    }
    mat-progress-bar {
      margin-top: 20px;
    }

    h6 {

      position: absolute;
    }
    `]
})
export class FormlyProgressbardComponent extends FieldType implements OnInit, AfterViewInit {
  // constructor() { }

  get progressBarData(): ProgressBarData {
    return this.field && this.field.templateOptions && this.field.templateOptions.value;
  }

  get progresValue() {
    return this.progressBarData ? this.progressBarData.value : 0;
  }

  // get mode(): ProgressBarType {
  //   if (this.field) {
  //     if (!_.isUndefined(this.field.templateOptions.mode)) {
  //       return this.field.templateOptions.mode;
  //     }
  //     if (this.field.formControl.value instanceof ProgressBarData) {
  //       return 'determinate';
  //     }
  //   }

  //   return 'indeterminate';
  // }

  get info() {
    if (this.progressBarData) {
      if (this.progressBarData.status === 'error') {
        return `<strong style="color:red" >${this.progressBarData.info}</strong>`
      } else if (this.progressBarData.status === 'complete') {
        return `<strong style="color:green" >${this.progressBarData.info}</strong>`
      } else if (this.progressBarData.status === 'inprogress') {
        return `<span >${this.progressBarData.info}</span>`
      }
    }
    return `
      <span style="color:lightgreen;opacity:0.7;"   >  -- process not stated -- </span>
    `
  }

  ngAfterViewInit() {
    // setTimeout(() => {
    //   if (_.isUndefined(this.model)) {
    //     this.field.templateOptions.value = new ProgressBarData();
    //   }

    //   if (_.isNumber(this.field.templateOptions.value)) {
    //     this.model.value = this.field.templateOptions.value;
    //   }

    //   log.i('model', this.model)
    // })
  }

  ngOnInit() {


  }

}

