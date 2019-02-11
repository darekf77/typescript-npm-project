import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessLoggerComponent } from './process-logger.component';

import { ButtonIconModule } from '../../base-components';


@NgModule({
  imports: [
    CommonModule,
    ButtonIconModule
  ],
  entryComponents: [ProcessLoggerComponent],
  exports: [ProcessLoggerComponent],
  declarations: [ProcessLoggerComponent]
})
export class ProcessLoggerModule { }
