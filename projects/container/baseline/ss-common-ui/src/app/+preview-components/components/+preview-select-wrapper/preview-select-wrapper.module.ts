import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewSelectWrapperComponent } from './preview-select-wrapper.component';
import { routes } from './preview-select-wrapper.routes';
import {
  SelectWrapperModule
} from 'components';
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
// third part
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/ExamplesController';
import { Morphi } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/EXAMPLE';

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
});

@NgModule({
  imports: [
    CommonModule,
    SelectWrapperModule,
    ...materialModules,
    ...angularModules,
    RouterModule.forChild(routes),
    FormlyMaterialModule,
    FormlyModule.forRoot(),
  ],
  declarations: [PreviewSelectWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewSelectWrapperModule { }
