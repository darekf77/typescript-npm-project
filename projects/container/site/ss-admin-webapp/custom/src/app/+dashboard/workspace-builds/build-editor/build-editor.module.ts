import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
// material
import { MatCardModule } from "@angular/material/card";
import { MatRadioModule } from '@angular/material/radio'
import { MatTabsModule } from '@angular/material/tabs'
// thirdpart
import { FormWrapperMaterialModule, DialogWrapperModule } from 'ss-common-ui/module-for-ss-admin-webapp';
import { TreeModule } from 'angular-tree-component';
// local
import { BuildEditorComponent } from './build-editor.component';
import { routes } from './build-editor.routes';
const localModules = [

]

const materialModules = [
  MatCardModule,
  MatRadioModule,
  MatTabsModule
]

const angularModules = [
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes)
]

@NgModule({
  imports: [
    ...angularModules,
    FormWrapperMaterialModule,
    DialogWrapperModule,
    TreeModule,
    ...localModules,
    ...materialModules
  ],
  exports: [BuildEditorComponent],
  declarations: [BuildEditorComponent]
})
export class BuildEditorModule { }
