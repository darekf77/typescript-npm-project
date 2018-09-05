import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildEditorComponent } from './build-editor.component';
import { RouterModule } from '@angular/router';
import { routes } from './build-editor.routes';
import { FormWrapperMaterialModule } from 'ss-common-ui/module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormWrapperMaterialModule
  ],
  exports: [BuildEditorComponent],
  declarations: [BuildEditorComponent]
})
export class BuildEditorModule { }
