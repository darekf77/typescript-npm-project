import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
// local
import { BuildingProcessComponent } from './building-process.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module';
import { LogPrcessModule } from '../log-prcess/log-prcess.module';


const materialModules = [
  MatSlideToggleModule
]

@NgModule({
  imports: [
    CommonModule,
    FormWrapperMaterialModule,
    LogPrcessModule,
    ...materialModules
  ],
  exports: [BuildingProcessComponent],
  declarations: [BuildingProcessComponent]
})
export class BuildingProcessModule { }
