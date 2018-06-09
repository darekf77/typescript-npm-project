import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryEditorComponent } from './category-editor.component';
import { CategoryResolver } from '../model/categorie.resolve';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    CategoryEditorComponent
  ],
  declarations: [CategoryEditorComponent],
  providers: [CategoryResolver]
})
export class CategoryEditorModule { }
