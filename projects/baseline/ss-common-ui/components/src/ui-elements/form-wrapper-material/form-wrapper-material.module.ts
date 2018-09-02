// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule, } from '@ngx-formly/material';
import { FormlyMatToggleModule } from '@ngx-formly/material/toggle';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormlyMatSliderModule } from '@ngx-formly/material/slider';
// custom formly components
import { SelectWrapperModule, SelectWrapperComponent } from '../select-wrapper';
import { MultimediaWrapperModule, MultimediaWrapperComponent } from '../multimedia-wrapper';

// other
import { NgStringPipesModule } from 'ngx-pipes';
// local
import { FormWrapperMaterialComponent } from './form-wrapper-material.component';
import { EditorWrapperModule, EditorWrapperComponent } from '../editor-wrapper';
import { ButtonWithActionComponent } from './additional-types';


const angularModules = [
  CommonModule,
  ReactiveFormsModule,
];

const materialModules = [
  MatButtonModule,
  MatIconModule,
  MatDialogModule
];

const myFormlyModules = [
  SelectWrapperModule,
  MultimediaWrapperModule,
  EditorWrapperModule
];

const formlyModules = [
  FormlyMaterialModule,
  FormlyModule.forRoot({
    types: [
      { name: 'selectwrapper', component: SelectWrapperComponent },
      { name: 'multimediawrapper', component: MultimediaWrapperComponent },
      { name: 'editorwrapper', component: EditorWrapperComponent },
      { name: 'button', component: ButtonWithActionComponent }
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
  NgStringPipesModule
];

@NgModule({
  imports: [
    ...angularModules,
    ...formlyModules,
    ...myFormlyModules,
    ...materialModules
  ],
  exports: [
    FormWrapperMaterialComponent,
    ButtonWithActionComponent
  ],
  declarations: [FormWrapperMaterialComponent, ButtonWithActionComponent]
})
export class FormWrapperMaterialModule { }
