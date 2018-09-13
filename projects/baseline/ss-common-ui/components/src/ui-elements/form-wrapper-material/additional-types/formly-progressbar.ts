import { Component, OnInit, AfterViewInit } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('formly progressbar')

import { ProgressBarStatus, ProgressBarType, ProgressBarData } from 'ss-common-logic/browser/entities/PROGRESS_BAR';

@Component({
  selector: 'app-formly-progressbar',
  template: `
      <!-- <h5 *ngIf="progressBarData" > progressBarData {{progressBarData | json}} </h5> -->
      <h6>

        <span *ngIf="field && field.templateOptions && field.templateOptions.label"> {{ field.templateOptions.label }} </span>
        <span  [innerHTML]="info"></span>
      </h6>
      <mat-progress-bar mode="determinate" value="{{ field.formControl.value && field.formControl.value.value }}" > </mat-progress-bar>
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
    return this.field.formControl.value;
  }



  ngAfterViewInit() {

  }

  ngOnInit() {


  }

}

