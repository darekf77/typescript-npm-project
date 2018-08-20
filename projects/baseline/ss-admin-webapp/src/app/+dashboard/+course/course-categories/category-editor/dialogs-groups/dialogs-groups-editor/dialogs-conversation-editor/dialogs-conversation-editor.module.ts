import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
// local
import { DialogsConversationEditorComponent } from './dialogs-conversation-editor.component';
// other
import { NgxEditorModule } from 'ngx-editor';

const angularModules = [
  CommonModule,
  FormsModule,
  HttpClientModule
]

@NgModule({
  imports: [
    ...angularModules,
    NgxEditorModule
  ],
  exports: [
    DialogsConversationEditorComponent
  ],
  declarations: [DialogsConversationEditorComponent]
})
export class DialogsConversationEditorModule { }
