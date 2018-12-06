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
import { FormWrapperMaterialModule } from 'ss-common-ui/module-for-ss-admin-webapp';
import { LogPrcessModule } from '../log-prcess/log-prcess.module';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyBuildTnpProcessComponent } from '../formly-build-tnp-process/formly-build-tnp-process.component';


const materialModules = [
  MatSlideToggleModule,
  MatProgressBarModule,
  MatExpansionModule,
  MatRadioModule,
  MatButtonModule,
  MatIconModule,
  MatTooltipModule
]

const additionalFormlyCmps = [
  FormlyBuildTnpProcessComponent
]

@NgModule({
  imports: [
    CommonModule,
    FormWrapperMaterialModule,
    LogPrcessModule,
    ...materialModules,
    FormlyModule.forChild({
      types: [
        FormlyBuildTnpProcessComponent.type
      ]
    })
  ],
  exports: [BuildingProcessComponent],
  declarations: [
    BuildingProcessComponent,
    ...additionalFormlyCmps
  ]
})
export class BuildingProcessModule { }
