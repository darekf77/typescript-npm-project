import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
// local
import { DialogsConversationEditorComponent } from './dialogs-conversation-editor.component';
// other
import { NgxEditorModule } from 'ngx-editor';
import { DialogPartComponent } from './dialog-part/dialog-part.component';

const angularModules = [
  CommonModule,
  FormsModule,
  HttpClientModule
]

const localComponents = [
  DialogsConversationEditorComponent,
  DialogPartComponent
]

@NgModule({
  imports: [
    ...angularModules,
    NgxEditorModule
  ],
  exports: [
    ...localComponents
  ],
  declarations: [
    ...localComponents
  ]
})
export class DialogsConversationEditorModule { }
