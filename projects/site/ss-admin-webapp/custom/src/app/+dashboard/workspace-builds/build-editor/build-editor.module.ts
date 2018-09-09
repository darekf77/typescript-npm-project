import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from "@angular/material/card";
// thirdpart
import { FormWrapperMaterialModule, DialogWrapperModule } from 'ss-common-ui/module';
// local
import { BuildEditorComponent } from './build-editor.component';
import { routes } from './build-editor.routes';
import { BuildingProcessModule } from './building-process/building-process.module';
import { ServingProcessModule } from './serving-process/serving-process.module';

const localModules = [
  BuildingProcessModule,
  ServingProcessModule
]

const materialModules = [
  MatCardModule
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormWrapperMaterialModule,
    DialogWrapperModule,
    ...localModules,
    ...materialModules
  ],
  exports: [BuildEditorComponent],
  declarations: [BuildEditorComponent]
})
export class BuildEditorModule { }
