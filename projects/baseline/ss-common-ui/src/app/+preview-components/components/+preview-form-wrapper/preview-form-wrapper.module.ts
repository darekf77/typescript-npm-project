import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
// local
import { PreviewFormWrapperComponent } from './preview-form-wrapper.component';
import { routes } from './preview-form-wrapper.routes';
import {
  ListWrapperModule
} from 'components';
// third part
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import { init, AngularProviders } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser/entities/EXAMPLE';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import {
  FormlyMaterialModule,
} from '@ngx-formly/material';
import { FormlyMatToggleModule } from '@ngx-formly/material/toggle';

const materialModules = [
  MatCardModule,
  MatButtonToggleModule
];

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

init({
  host,
  controllers: [ExamplesController],
  entities: [EXAMPLE]
})
  .angularProviders();

@NgModule({
  imports: [
    CommonModule,
    ListWrapperModule,
    ...materialModules,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormlyMaterialModule,
    FormlyModule.forRoot({
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
    }),
    FormlyMatToggleModule,
  ],
  declarations: [PreviewFormWrapperComponent],
  providers: [
    AngularProviders
  ]
})
export class PreviewFormWrapperModule { }
