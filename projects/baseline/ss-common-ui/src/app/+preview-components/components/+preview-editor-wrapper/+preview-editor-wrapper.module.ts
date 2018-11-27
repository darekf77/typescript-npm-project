import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewEditorWrapperComponent } from './+preview-editor-wrapper.component';
import { routes } from './+preview-editor-wrapper.routes';
import {
  EditorWrapperModule
} from 'components';
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
// third part
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';
import { init, AngularProviders } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/entities/EXAMPLE';

const angularModules = [
  ReactiveFormsModule
];

const materialModules = [
  MatCardModule
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
    EditorWrapperModule,
    ...materialModules,
    ...angularModules,
    RouterModule.forChild(routes),
    FormlyMaterialModule,
    FormlyModule.forRoot({
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
    }),
  ],
  declarations: [PreviewEditorWrapperComponent],
  providers: [
    AngularProviders
  ]
})
export class PreviewEditorWrapperModule { }
