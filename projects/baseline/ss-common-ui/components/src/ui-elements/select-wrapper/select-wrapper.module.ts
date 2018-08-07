import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule, } from '@ngx-formly/material';

const angularModules = [
  ReactiveFormsModule
];

const materialModules = [
  MatSelectModule,
  MatListModule,
  MatIconModule,
  MatProgressSpinnerModule
];

const moduleOther = [
  NgxDatatableModule
];

const formlyModules = [
  FormlyMaterialModule,
  FormlyModule.forRoot({
    validationMessages: [
      { name: 'required', message: 'This field is required' },
    ],
  })
];

@NgModule({
  imports: [
    CommonModule,
    ...angularModules,
    ...moduleOther,
    ...materialModules,
    ...formlyModules
  ],
  exports: [
    SelectWrapperComponent
  ],
  declarations: [SelectWrapperComponent]
})
export class SelectWrapperModule { }
