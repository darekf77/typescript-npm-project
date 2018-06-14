import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreviewTableWrapperComponent } from './preview-table-wrapper.component';
import { routes } from './preview-table-wrapper.routes';
import {
  TableWrapperModule
} from 'components';


@NgModule({
  imports: [
    CommonModule,
    TableWrapperModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PreviewTableWrapperComponent]
})
export class PreviewTableWrapperModule { }
