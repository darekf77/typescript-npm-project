// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { DialogsGroupsComponent } from './dialogs-groups.component';
import { routes } from './dialogs-groups.routes';
import {  DialogsGroupsEditorModule } from './dialogs-groups-editor';


@NgModule({
  imports: [
    CommonModule,
    DialogsGroupsEditorModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    DialogsGroupsComponent,
  ]
})
export class DialogsGroupsModule { }
