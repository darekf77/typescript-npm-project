import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewDialogFieldComponent } from './+preview-dialog-field.component';
import { routes } from './+preview-dialog-field.routes';
import {
  DialogFieldModule
} from 'components';
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { Morphi } from 'morphi/browser';

const angularModules = [
  CommonModule,
  ReactiveFormsModule,
  RouterModule.forChild(routes),
];

const materialModules = [
  MatCardModule
];

const formlyModules = [
  FormlyMaterialModule,
  FormlyModule.forRoot({
    validationMessages: [
      { name: 'required', message: 'This field is required' }
    ]
  })
];


@NgModule({
  imports: [
    DialogFieldModule,
    ...materialModules,
    ...angularModules,
    ...formlyModules
  ],
  declarations: [PreviewDialogFieldComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewSelectWrapperModule { }
