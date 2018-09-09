import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildingProcessComponent } from './building-process.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module';

@NgModule({
  imports: [
    CommonModule,
    FormWrapperMaterialModule
  ],
  exports: [BuildingProcessComponent],
  declarations: [BuildingProcessComponent]
})
export class BuildingProcessModule { }
