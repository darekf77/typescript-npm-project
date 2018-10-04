import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatRadioModule } from '@angular/material/radio'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
// local
import { BuildingProcessComponent } from './building-process.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module';
import { LogPrcessModule } from '../log-prcess/log-prcess.module';


const materialModules = [
  MatSlideToggleModule,
  MatProgressBarModule,
  MatExpansionModule,
  MatRadioModule,
  MatButtonModule,
  MatIconModule,
  MatTooltipModule
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
