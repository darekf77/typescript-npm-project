import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewFormlyInputsComponent } from './preview-formly-inputs.component';
import { routes } from './preview-formly-inputs.routes';
import {
  ListWrapperModule
} from 'ss-common-ui/module';
// third part
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/ExamplesController';
import { Morphi } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/EXAMPLE';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';

const materialModules = [
  MatCardModule
];

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [ExamplesController],
  entities: [EXAMPLE]
})

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
  ],
  declarations: [PreviewFormlyInputsComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewFormlyInputsModule { }
