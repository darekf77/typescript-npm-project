import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessLoggerComponent } from './process-logger.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [ProcessLoggerComponent],
  declarations: [ProcessLoggerComponent]
})
export class ProcessLoggerModule { }
