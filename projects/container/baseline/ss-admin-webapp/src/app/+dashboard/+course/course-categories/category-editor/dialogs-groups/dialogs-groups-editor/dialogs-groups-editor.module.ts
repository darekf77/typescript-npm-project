import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatCardModule } from '@angular/material/card'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
// local
import { DialogsGroupsEditorComponent } from './dialogs-groups-editor.component';
import {
  TableWrapperModule,
  FormWrapperMaterialModule,

} from 'ss-common-ui/browser-for-ss-admin-webapp';

import { DialogsConversationEditorModule } from 'ss-common-logic/browser-for-ss-admin-webapp/apps/dialog/dialogs-conversation-editor';

const angularModules = [
  CommonModule
];

const materialModules = [
  MatCardModule,
  MatSlideToggleModule
]

const otherModuels = [
  TableWrapperModule,
  FormWrapperMaterialModule,
  DialogsConversationEditorModule
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
