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
  ListWrapperModule, FormWrapperMaterialModule
} from 'components';
// third part
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';
import { Morphi } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/entities/EXAMPLE';



const materialModules = [
  MatCardModule,
  MatButtonToggleModule
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
    ListWrapperModule,
    ...materialModules,
    RouterModule.forChild(routes),
    FormWrapperMaterialModule
  ],
  declarations: [PreviewFormWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewFormWrapperModule { }
