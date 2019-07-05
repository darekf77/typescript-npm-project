import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreviewTableWrapperComponent } from './preview-table-wrapper.component';
import { routes } from './preview-table-wrapper.routes';
import {
  TableWrapperModule
} from 'ss-components/components';

import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';
import { ExamplesPaginationController } from 'ss-common-logic/src/apps/example/ExamplesPaginationController';
import { EXAMPLE_PAGINATION } from 'ss-common-logic/src/apps/example/EXAMPLE_PAGINATION';
import { Morphi } from 'morphi';
import { EXAMPLE } from 'ss-common-logic/src/apps/example/EXAMPLE';

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
