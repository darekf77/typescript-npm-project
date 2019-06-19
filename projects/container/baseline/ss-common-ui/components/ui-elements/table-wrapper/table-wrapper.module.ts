import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//material
import { MatSelectModule } from '@angular/material/select';
// other
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
// local
import { TableWrapperComponent } from './table-wrapper.component';

const materialModules = [
  MatSelectModule
]

const moduleOther = [
  NgxDatatableModule
];

@NgModule({
  imports: [
    CommonModule,
    ...moduleOther,
    ...materialModules
  ],
  exports: [
    TableWrapperComponent
  ],
  declarations: [TableWrapperComponent]
})
export class TableWrapperModule { }
