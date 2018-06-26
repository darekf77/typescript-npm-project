import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreviewTableWrapperComponent } from './preview-table-wrapper.component';
import { routes } from './preview-table-wrapper.routes';
import {
  TableWrapperModule
} from 'components';

import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import { init, AngularProviders } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser/entities/EXAMPLE';


init(ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host)
  .angularProviders({
    controllers: [ExamplesController],
    entities: [EXAMPLE]
  });

@NgModule({
  imports: [
    CommonModule,
    TableWrapperModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PreviewTableWrapperComponent],
  providers: [
    AngularProviders
  ]
})
export class PreviewTableWrapperModule { }
