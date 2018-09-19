import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from "@angular/material/card";
import { MatRadioModule } from '@angular/material/radio'
import { MatTabsModule } from '@angular/material/tabs'
// thirdpart
import { FormWrapperMaterialModule, DialogWrapperModule } from 'ss-common-ui/module';
import { TreeModule } from 'angular-tree-component';
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
  MatCardModule,
  MatRadioModule,
  MatTabsModule
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormWrapperMaterialModule,
    DialogWrapperModule,
    TreeModule.forRoot(),
    ...localModules,
    ...materialModules
  ],
  exports: [BuildEditorComponent],
  declarations: [BuildEditorComponent]
})
export class BuildEditorModule { }
