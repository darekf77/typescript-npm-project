import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// other
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
// local
import { ListWrapperComponent } from './list-wrapper.component';
import { FormWrapperMaterialModule } from '../../form';

const materialModules = [
  MatSelectModule,
  MatListModule,
  MatIconModule,
  MatProgressSpinnerModule,
  MatButtonModule,
  MatCardModule
];

const moduleOther = [
  NgxDatatableModule
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormWrapperMaterialModule,
    ...moduleOther,
    ...materialModules
  ],
  exports: [
    ListWrapperComponent
  ],
  declarations: [ListWrapperComponent]
})
export class ListWrapperModule { }
