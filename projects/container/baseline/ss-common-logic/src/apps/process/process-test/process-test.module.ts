import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessTestComponent } from './process-test.component';
import { ResizeService } from 'ss-common-ui/browser-for-ss-common-logic/helpers';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ProcessTestComponent],
  exports: [ProcessTestComponent],
  providers: [ResizeService]
})
export class ProcessTestModule { }
