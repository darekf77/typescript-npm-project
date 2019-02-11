// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule, } from '@ngx-formly/material';
import { FormlyMatToggleModule } from '@ngx-formly/material/toggle';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormlyMatSliderModule } from '@ngx-formly/material/slider';
import { RepeatTypeComponent } from 'morphi/browser/crud/formly-repeat-component';
import { FormlyHorizontalWrapper } from 'morphi/browser/crud/formly-group-wrapper-component';

// custom formly components
import { SelectWrapperModule, SelectWrapperComponent } from '../base-components/select';
import { MultimediaWrapperModule, MultimediaWrapperComponent } from '../entity-components/multimedia';

// other
import { Morphi } from 'morphi/browser';
import { NgStringPipesModule } from 'ngx-pipes';
// local
import { FormWrapperMaterialComponent } from './form-wrapper-material.component';

// base components
import {
  EditorWrapperModule,
  EditorWrapperComponent
} from '../base-components/editor';

// aditional types componets
import {
  ButtonWithActionComponent,
  FormlyProgressbardComponent,
  FormlySwitchComponent,
  IconButtonWithActionComponent
} from './additional-types';
// import { ProcessLoggerModule } from '../entity-components/process-logger';



const angularModules = [
  CommonModule,
  ReactiveFormsModule,
];

const materialModules = [
  MatButtonModule,
  MatIconModule,
  MatDialogModule,
  FormlyMatToggleModule,
  MatSlideToggleModule,
  MatProgressBarModule
];

const myFormlyModules = [
  SelectWrapperModule,
  MultimediaWrapperModule,
  EditorWrapperModule
];

console.log('Morphi.Formly.getAllRegisterdTypes()', Morphi.Formly.getAllRegisterdTypes());

const formlyModules = [
  FormlyMaterialModule,
  FormlyModule.forRoot({
    types: [
      ...Morphi.Formly.getAllRegisterdTypes(),
      { name: 'button', component: ButtonWithActionComponent },
      { name: 'switch', component: FormlySwitchComponent },
      { name: 'iconbutton', component: IconButtonWithActionComponent },
      { name: 'infoprogressbar', component: FormlyProgressbardComponent },
      { name: 'repeat', component: RepeatTypeComponent }
    ],
    validationMessages: [
      { name: 'required', message: 'This field is required' },
    ],
    wrappers: [{ name: 'groupwrap', component: FormlyHorizontalWrapper }],
  }),
  FormlyMatToggleModule,
  FormlyMatDatepickerModule,
  MatNativeDateModule,
  FormlyMatSliderModule,
  // custom
  NgStringPipesModule
];

const customComponetns = [
  FormWrapperMaterialComponent,
  ButtonWithActionComponent,
  FormlySwitchComponent,
  IconButtonWithActionComponent,
  FormlyProgressbardComponent,
  RepeatTypeComponent,
  FormlyHorizontalWrapper
];

const entityModules = [
  // ProcessLoggerModule
];

@NgModule({
  imports: [
    ...angularModules,
    ...formlyModules,
    ...myFormlyModules,
    ...materialModules,
    ...entityModules
  ],
  exports: [
    ...customComponetns
  ],
  declarations: [
    ...customComponetns
  ]
})
export class FormWrapperMaterialModule { }
