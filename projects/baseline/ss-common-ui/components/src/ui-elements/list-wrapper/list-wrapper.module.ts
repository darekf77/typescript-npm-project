import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// other
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
// local
import { ListWrapperComponent } from './list-wrapper.component';

const materialModules = [
  MatSelectModule,
  MatListModule,
  MatIconModule,
  MatProgressSpinnerModule
];

const moduleOther = [
  NgxDatatableModule
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ...moduleOther,
    ...materialModules
  ],
  exports: [
    ListWrapperComponent
  ],
  declarations: [ListWrapperComponent]
})
export class ListWrapperModule { }
