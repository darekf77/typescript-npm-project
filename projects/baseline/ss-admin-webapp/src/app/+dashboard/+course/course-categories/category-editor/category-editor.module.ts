import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { CategoryEditorComponent } from './category-editor.component';

import { MatListModule } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";

const materialModules = [
  MatListModule,
  MatTabsModule,
  MatIconModule,
  MatInputModule,
  MatCardModule
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ...materialModules
  ],
  exports: [
    CategoryEditorComponent
  ],
  declarations: [CategoryEditorComponent],
  providers: []
})
export class CategoryEditorModule { }
