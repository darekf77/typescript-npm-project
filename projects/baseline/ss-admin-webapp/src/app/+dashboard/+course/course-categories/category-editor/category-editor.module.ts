import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryEditorComponent } from './category-editor.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    CategoryEditorComponent
  ],
  declarations: [CategoryEditorComponent]
})
export class CategoryEditorModule { }
