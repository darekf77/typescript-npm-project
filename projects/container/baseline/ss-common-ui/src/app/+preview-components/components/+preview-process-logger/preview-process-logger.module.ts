import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewProcessLoggerComponent } from './preview-process-logger.component';
import { RouterModule } from '@angular/router';

import {
  ProcessLoggerModule
} from 'components';

@NgModule({
  imports: [
    CommonModule,
    ProcessLoggerModule,
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'prefix',
        component: PreviewProcessLoggerComponent,
      }
    ])
  ],
  declarations: [PreviewProcessLoggerComponent]
})
export class PreviewProcessLoggerModule {

}
