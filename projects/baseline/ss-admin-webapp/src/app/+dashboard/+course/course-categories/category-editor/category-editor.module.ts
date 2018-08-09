// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatListModule } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
// local
import { CategoryEditorComponent } from './category-editor.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/module';

const materialModules = [
  MatListModule,
  MatTabsModule,
  MatIconModule,
  MatInputModule,
  MatCardModule,
  MatButtonModule
]


@NgModule({
  imports: [
    CommonModule,
    FormWrapperMaterialModule,
    ...materialModules
  ],
  exports: [
    CategoryEditorComponent
  ],
  declarations: [CategoryEditorComponent],
  providers: []
})
export class CategoryEditorModule { }
