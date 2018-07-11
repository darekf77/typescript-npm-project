import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// other
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
// local
import { SelectWrapperComponent } from './select-wrapper.component';

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
    ...moduleOther,
    ...materialModules
  ],
  exports: [
    SelectWrapperComponent
  ],
  declarations: [SelectWrapperComponent]
})
export class SelectWrapperModule { }
