import { Component, OnInit, Input, Output } from '@angular/core';
import { times } from 'lodash';
import { BaseCRUD } from 'morphi/browser';
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import { Log, Level } from 'ng2-logger/browser';

const log = Log.create('Table wrapper');

@Component({
  selector: 'app-table-wrapper',
  templateUrl: './table-wrapper.component.html',
  styleUrls: ['./table-wrapper.component.scss']
})
export class TableWrapperComponent implements OnInit {

  @Input() crud: BaseCRUD<any>;

  public messages = {
    emptyMessage: undefined,
    totalMessage: undefined
  };

  @Input() rows = times(50, (id) => {
    return {
      id,
      name: `Amazing ${id} row `
    };
  });

  @Input() columns = [
    {
      prop: 'id'
    },
    {
      prop: 'name'
    }
  ];

  constructor() { }

  checkCrud() {
    console.clear();
    log.i('this.crud', this.crud);
    this.crud.getAll().received.observable.subscribe(c => {
      log.i('AMAZING!', c);
    });
  }

  ngOnInit() {
  }

}
