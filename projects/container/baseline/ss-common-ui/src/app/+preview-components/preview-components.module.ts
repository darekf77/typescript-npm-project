
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { PreviewComponents } from './preview-components.component';
import { routes } from './preview-components.routes';
import {
  LayoutComponentsListDocsModule
} from 'ss-common-ui/module/layouts/layout-components-list-docs';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    LayoutComponentsListDocsModule
  ],
  declarations: [PreviewComponents]
})
export class PreviewComponentsModule { }

