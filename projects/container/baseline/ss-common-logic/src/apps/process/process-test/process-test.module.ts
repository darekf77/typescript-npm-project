import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessTestComponent } from './process-test.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ProcessTestComponent],
  exports: [ProcessTestComponent]
})
export class ProcessTestModule { }
