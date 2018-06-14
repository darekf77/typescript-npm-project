import { Component, OnInit, Input, Output } from '@angular/core';
import { times } from 'lodash';
// import {  } from "@swimlane/ngx-datatable";

@Component({
  selector: 'app-table-wrapper',
  templateUrl: './table-wrapper.component.html',
  styleUrls: ['./table-wrapper.component.scss']
})
export class TableWrapperComponent implements OnInit {

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

  ngOnInit() {
  }

}
