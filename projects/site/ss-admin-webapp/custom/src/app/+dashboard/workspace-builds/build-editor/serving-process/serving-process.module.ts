import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServingProcessComponent } from './serving-process.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module';

@NgModule({
  imports: [
    CommonModule,
    FormWrapperMaterialModule
  ],
  exports: [ServingProcessComponent],
  declarations: [ServingProcessComponent]
})
export class ServingProcessModule { }
