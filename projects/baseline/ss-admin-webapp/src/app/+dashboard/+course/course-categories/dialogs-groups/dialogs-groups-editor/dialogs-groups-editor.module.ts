import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatCardModule } from '@angular/material/card'
// local
import { DialogsGroupsEditorComponent } from './dialogs-groups-editor.component';
import { TableWrapperModule, FormWrapperMaterialModule } from 'ss-common-ui/module';

const angularModules = [
  CommonModule
];

const materialModules = [
  MatCardModule
]

const otherModuels = [
  TableWrapperModule,
  FormWrapperMaterialModule
]

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    ...otherModuels
  ],
  exports: [
    DialogsGroupsEditorComponent
  ],
  declarations: [DialogsGroupsEditorComponent]
})
export class DialogsGroupsEditorModule { }
