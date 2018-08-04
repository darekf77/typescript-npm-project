import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormWrapperMaterialComponent } from './form-wrapper-material.component';
import { ReactiveFormsModule } from '@angular/forms';

// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule, } from '@ngx-formly/material';
import { FormlyMatToggleModule } from '@ngx-formly/material/toggle';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormlyMatSliderModule } from '@ngx-formly/material/slider';

// material
import { MatButtonModule } from "@angular/material/button";

const materialModules = [
  MatButtonModule
]

const formlyModules = [
  FormlyMaterialModule,
  FormlyModule.forRoot({
    validationMessages: [
      { name: 'required', message: 'This field is required' },
    ],
  }),
  FormlyMatToggleModule,
  FormlyMatDatepickerModule,
  MatNativeDateModule,
  FormlyMatSliderModule
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...formlyModules,
    ...materialModules
  ],
  exports: [
    FormWrapperMaterialComponent
  ],
  declarations: [FormWrapperMaterialComponent]
})
export class FormWrapperMaterialModule { }
