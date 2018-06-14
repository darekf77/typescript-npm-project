import { Component, OnInit, Input, Output } from '@angular/core';
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

  @Input() rows = [
    {
      id: 1,
      name: 'Amazing first row'
    },
    {
      id: 2,
      name: 'Amazing second row'
    }

  ];

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
