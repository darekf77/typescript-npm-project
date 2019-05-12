import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
// material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// local
import { DialogsConversationEditorComponent } from './dialogs-conversation-editor.component';
// other
import { NgxEditorModule } from 'ngx-editor';
import { DialogPartComponent } from './dialog-part/dialog-part.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module/formly';

const angularModules = [
  CommonModule,
  FormsModule,
  HttpClientModule
];

const materialModules = [
  MatIconModule,
  MatButtonModule,
  MatSlideToggleModule
];

const localComponents = [
  DialogsConversationEditorComponent,
  DialogPartComponent
];

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    NgxEditorModule,
    FormWrapperMaterialModule
  ],
  exports: [
    ...localComponents,
    ...materialModules
  ],
  declarations: [
    ...localComponents
  ]
})
export class DialogsConversationEditorModule { }
