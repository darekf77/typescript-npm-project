// angular
import { Component, OnInit, Input, Output, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';

import { Morphi } from 'morphi/browser';

import { Log, Level } from 'ng2-logger/browser';
import { interpolateParamsToUrl } from 'ng2-rest/browser/params';
import { Helpers } from 'morphi/browser/helpers';


const log = Log.create('select wrapper');

export interface CRUDSelectWrapperOption {
  value: string;
  label: string;
}


@Component({
  selector: 'app-select-wrapper',
  templateUrl: './select-wrapper.component.html',
  styleUrls: ['./select-wrapper.component.scss']
})
export class SelectWrapperComponent extends FieldType implements OnInit, AfterViewInit {

  isLoading = false;

  @Input() crud: Morphi.CRUD.Base<any>;

  @Input() selectOptions: CRUDSelectWrapperOption[] = [];


  @Input() data = [
    { value: 'dupa', label: 'Onet' },
    { value: 2, label: 'Google' }
  ];

  @Input() valueProp = 'id';
  @Input() nameProp = 'name';

  // fields: FormlyFieldConfig[] = [];

  // @Input() lable: string;

  async ngOnInit() {
    super.ngOnInit();

    if (!this.crud && _.isFunction(_.get(this.field, 'templateOptions.crud'))) {
      this.crud = this.field.templateOptions.crud;
    }

    if (_.isFunction(this.crud)) {
      this.isLoading = true;
      log.i('this.crud.entity', Helpers.Class.describeProperites(this.crud.entity));
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
    this.selectOptions = rows.map(r => {
      if (!this.crud) {
        return r;
      }
      return { value: r[this.valueProp], label: r[this.nameProp] };
    });
  }

  ngAfterViewInit() {
    // log.i('this', this.field);
  }

}
