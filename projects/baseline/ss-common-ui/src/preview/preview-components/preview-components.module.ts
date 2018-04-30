
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { PreviewComponents } from './preview-components.component';
import { routes } from './preview-components.routes';
import {

} from 'components';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),

  ],
  declarations: [PreviewComponents],
  providers: [],
})
export class PreviewComponentsModule { }

