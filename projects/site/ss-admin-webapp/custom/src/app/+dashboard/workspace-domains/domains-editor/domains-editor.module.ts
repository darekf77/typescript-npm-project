import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
// local
import { DomainsEditorComponent } from './domains-editor.component';
import { FormWrapperMaterialModule, DialogWrapperModule } from 'ss-common-ui/module-for-ss-admin-webapp';
import { routes } from './domains-editor.routes';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormWrapperMaterialModule,
    DialogWrapperModule
  ],
  exports: [DomainsEditorComponent],
  declarations: [DomainsEditorComponent]
})
export class DomainsEditorModule { }
