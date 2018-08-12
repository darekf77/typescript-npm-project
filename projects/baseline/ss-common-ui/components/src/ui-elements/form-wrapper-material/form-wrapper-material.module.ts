// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule } from "@angular/material/dialog";
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule, } from '@ngx-formly/material';
import { FormlyMatToggleModule } from '@ngx-formly/material/toggle';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormlyMatSliderModule } from '@ngx-formly/material/slider';
// custom formly components
import { SelectWrapperModule, SelectWrapperComponent } from '../select-wrapper';

// other
import { NgStringPipesModule } from "ngx-pipes";
// local
import { FormWrapperMaterialComponent } from './form-wrapper-material.component';


const angularModules = [
  CommonModule,
  ReactiveFormsModule,
];

const materialModules = [
  MatButtonModule,
  MatIconModule,
  MatDialogModule
];


const formlyModules = [
  FormlyMaterialModule,
  FormlyModule.forRoot({
    types: [
      { name: 'selectwrapper', component: SelectWrapperComponent }
    ],
    validationMessages: [
      { name: 'required', message: 'This field is required' },
    ],
  }),
  FormlyMatToggleModule,
  FormlyMatDatepickerModule,
  MatNativeDateModule,
  FormlyMatSliderModule,
  // custom
  SelectWrapperModule,
  NgStringPipesModule
];

@NgModule({
  imports: [
    ...angularModules,
    ...formlyModules,
    ...materialModules
  ],
  exports: [
    FormWrapperMaterialComponent
  ],
  declarations: [FormWrapperMaterialComponent]
})
export class FormWrapperMaterialModule { }
