import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewSelectWrapperComponent } from './preview-select-wrapper.component';
import { routes } from './preview-select-wrapper.routes';
import {
  SelectWrapperModule
} from 'components';
// third part
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import { init, AngularProviders } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser/entities/EXAMPLE';


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
    SelectWrapperModule,
    ...materialModules,
    RouterModule.forChild(routes)
  ],
  declarations: [PreviewSelectWrapperComponent],
  providers: [
    AngularProviders
  ]
})
export class PreviewSelectWrapperModule { }
