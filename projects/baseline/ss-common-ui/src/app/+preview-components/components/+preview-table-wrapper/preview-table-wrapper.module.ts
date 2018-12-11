import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreviewTableWrapperComponent } from './preview-table-wrapper.component';
import { routes } from './preview-table-wrapper.routes';
import {
  TableWrapperModule
} from 'components';

import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';
import { ExamplesPaginationController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesPaginationController';
import { EXAMPLE_PAGINATION } from 'ss-common-logic/browser-for-ss-common-ui/entities/EXAMPLE_PAGINATION';
import { Morphi } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/entities/EXAMPLE';

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [ExamplesController, ExamplesPaginationController],
  entities: [EXAMPLE, EXAMPLE_PAGINATION]
});

@NgModule({
  imports: [
    CommonModule,
    TableWrapperModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PreviewTableWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewTableWrapperModule { }
