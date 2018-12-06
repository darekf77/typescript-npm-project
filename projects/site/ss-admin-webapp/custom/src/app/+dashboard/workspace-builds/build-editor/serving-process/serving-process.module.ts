import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServingProcessComponent } from './serving-process.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module-for-ss-admin-webapp';
import { LogPrcessModule } from '../log-prcess/log-prcess.module';

@NgModule({
  imports: [
    CommonModule,
    FormWrapperMaterialModule,
    LogPrcessModule
  ],
  exports: [ServingProcessComponent],
  declarations: [ServingProcessComponent]
})
export class ServingProcessModule { }
