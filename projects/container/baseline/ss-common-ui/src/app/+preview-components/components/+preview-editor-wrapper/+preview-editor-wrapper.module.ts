import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewEditorWrapperComponent } from './+preview-editor-wrapper.component';
import { routes } from './+preview-editor-wrapper.routes';
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
// third part
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/ExamplesController';
import { Morphi } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/EXAMPLE';
import { FormWrapperMaterialModule } from 'ss-common-ui/components/formly';

const angularModules = [
  ReactiveFormsModule
];

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
    ...materialModules,
    ...angularModules,
    RouterModule.forChild(routes),
    FormWrapperMaterialModule,
  ],
  exports: [
    FormWrapperMaterialModule,
  ],
  declarations: [PreviewEditorWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewEditorWrapperModule { }
