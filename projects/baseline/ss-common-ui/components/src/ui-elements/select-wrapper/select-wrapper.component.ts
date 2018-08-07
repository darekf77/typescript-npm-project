// angular
import { Component, OnInit, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import { times } from 'lodash';
import { BaseCRUD, Describer } from 'morphi/browser';
import { META } from 'ss-common-logic/browser/helpers';
import { Log, Level } from 'ng2-logger/browser';
import { interpolateParamsToUrl } from 'ng2-rest/browser/params';


const log = Log.create('select wrapper');

export interface CRUDSelectWrapperOption {
  value: string;
  name: string;
}


@Component({
  selector: 'app-select-wrapper',
  templateUrl: './select-wrapper.component.html',
  styleUrls: ['./select-wrapper.component.scss']
})
export class SelectWrapperComponent extends FieldType implements OnInit {

  isLoading = false;

  @Input() crud: BaseCRUD<any>;

  @Input() selectOptions: CRUDSelectWrapperOption[] = [];


  @Input() data = [
    { value: 'dupa', label: 'Onet' },
    { value: 2, label: 'Google' }
  ];

  @Input() valueProp = 'id';
  @Input() nameProp = 'name';

  fields: FormlyFieldConfig[] = [];

  @Input() lable: string;

  async ngOnInit() {
    super.ngOnInit();

    const self = this;

    this.field = {
      key: 'Select',
      type: 'select',
      templateOptions: {
        label: 'Select',
        placeholder: 'Placeholder',
        description: 'Description',
        required: true,
        options: []
      }
    };

    if (this.crud) {
      this.isLoading = true;
      log.i('this.crud.entity', Describer.describe(this.crud.entity));
      try {
        const rows = await this.crud.getAll().received.observable.take(1).toPromise();
        this.initOptions(rows.body.json);
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    } else {
      this.initOptions(this.data);
    }

  }

  initOptions(rows: any[]) {
    setTimeout(() => {
      log.i('options ', this.selectOptions);
      this.field.templateOptions.options = rows.map(o => {
        if (!this.crud) {
          return o;
        }
        return {
          value: o[this.valueProp],
          label: o[this.nameProp]
        };
      });
      log.i('this field update with options', this.field);
      this.fields = [this.field];
    });
  }


}
