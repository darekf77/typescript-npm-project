import { Component, OnInit, Input, Output } from '@angular/core';
import { times } from 'lodash';
import { BaseCRUD } from 'morphi/browser';
import { META } from 'ss-common-logic/browser/helpers';
import { Log, Level } from 'ng2-logger/browser';
import { interpolateParamsToUrl } from 'ng2-rest/browser/params';
import { Router } from '@angular/router';

const log = Log.create('List wrapper');

export interface CRUDSelectWrapperOption {
  value: string;
  name: string;
}


@Component({
  selector: 'app-select-wrapper',
  templateUrl: './select-wrapper.component.html',
  styleUrls: ['./select-wrapper.component.scss']
})
export class SelectWrapperComponent implements OnInit {

  isLoading = false;

  @Input() crud: BaseCRUD<any>;

  @Input() options: CRUDSelectWrapperOption[] = [

  ];

  @Input() data = [
    { value: 'dupa', name: 'Onet' },
    { value: 2, name: 'Google' }
  ];

  @Input() valueProp = 'id';
  @Input() nameProp = 'name';

  columns = [
    {
      prop: 'id'
    },
    {
      prop: 'name'
    }
  ];

  async ngOnInit() {
    const columns = META.Describer.describe(this.crud.entity).map(prop => {
      return { prop };
    });
    this.columns = columns;

    if (this.crud) {
      this.isLoading = true;
      log.i('this.crud.entity', META.Describer.describe(this.crud.entity));
      try {

        log.i('columns', columns);
        const rows = await this.crud.getAll().received.observable.take(1).toPromise();
        this.isLoading = false;
        this.initOptions(rows.body.json);
      } catch (error) {
        this.isLoading = false;
      }
    } else {
      this.initOptions(this.data);
    }

  }

  initOptions(rows: any[]) {
    this.options = rows.map(r => {
      return { value: r[this.valueProp], name: r[this.nameProp] };
    });
    log.i('options ', this.options);
  }


}
