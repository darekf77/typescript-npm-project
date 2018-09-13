import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatProgressBarModule } from '@angular/material/progress-bar'
// local
import { BuildingProcessComponent } from './building-process.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module';
import { LogPrcessModule } from '../log-prcess/log-prcess.module';


const materialModules = [
  MatSlideToggleModule,
  MatProgressBarModule
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
