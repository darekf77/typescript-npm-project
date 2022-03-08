import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { MatDialog } from '@angular/material/dialog';
import { PROJECT } from '../../../PROJECT';
import { BaseComponent } from 'tnp-helpers';
import { TnpProjectTabIndex } from '../tabs-menu-tnp-project';

@Component({
  selector: 'app-base-item-stepper-process-build',
  template: ''
})
export abstract class BaseItemStepperProcessBuildComponent extends BaseComponent implements OnInit {

  @Input() formGroup: FormGroup;
  @Input() model: PROJECT;

  abstract tabNumber(): TnpProjectTabIndex;
  // @ts-ignore
  abstract async tabSelectedAction(tabIndex?: number);
  // @ts-ignore
  abstract async formValueChanged();

  fields: FormlyFieldConfig[];



  constructor(

    private _formBuilder: FormBuilder,
    protected cd: ChangeDetectorRef,
    public matDialog: MatDialog) {
    super()
  }

  ngOnInit() {

    const h = this.model.selectedTabChanged.subscribe(tabNum => {
      if (tabNum === this.tabNumber()) {
        this.tabSelectedAction && this.tabSelectedAction(tabNum)
      }
    });
    this.handlers.push(h as any);

    this.handlers.push(this.formGroup.valueChanges.subscribe(() => {
      this.formValueChanged && this.formValueChanged();
    }) as any)

  }

}
