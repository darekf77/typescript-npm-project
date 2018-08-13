import { Component, OnInit, Input, Output } from '@angular/core';
import { times } from 'lodash';
import { BaseCRUD, Describer, ArrayDataConfig } from 'morphi/browser';
import { META } from 'ss-common-logic/browser/helpers';
import { Log, Level } from 'ng2-logger/browser';
import { Router } from '@angular/router';

const log = Log.create('Table wrapper');


@Component({
  selector: 'app-table-wrapper',
  templateUrl: './table-wrapper.component.html',
  styleUrls: ['./table-wrapper.component.scss']
})
export class TableWrapperComponent implements OnInit {

  arrayDataConfig = new ArrayDataConfig();

  @Input() rowHref: string;

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


  setPage(n: number) {
    log.i(`set page ${n}`);
  }

  async ngOnInit() {
    this.arrayDataConfig.config.pagination.rowsDisplayed = 5;
    log.i('arrayDataConfig', this.arrayDataConfig);
    log.i('this.crud.entity', Describer.describeByEverything(this.crud.entity));

    try {
      const columns = Describer.describeByEverything(this.crud.entity).map(prop => {
        return { prop };
      });
      this.columns = columns;
      log.i('columns', columns);
      await this.retriveData();

    } catch (error) {

    }
  }
  async retriveData() {
    const rows = await this.crud.getAll(this.arrayDataConfig.config).received.observable.take(1).toPromise();
    log.i('rows', rows.body.json);
    this.rows = rows.body.json;
  }

  onTableContextMenu(e) {
    // if (this.rowHref) {
    //   this.router.navigateByUrl(this.rowHref)
    // }
    log.i('context menu event', e);
  }

}
