import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// other
import { NgxDatatableModule } from "@swimlane/ngx-datatable";
// local
import { TableWrapperComponent } from './table-wrapper.component';


const moduleOther = [
  NgxDatatableModule
];

@NgModule({
  imports: [
    CommonModule,
    ...moduleOther
  ],
  exports: [
    TableWrapperComponent
  ],
  declarations: [TableWrapperComponent]
})
export class TableWrapperModule { }
