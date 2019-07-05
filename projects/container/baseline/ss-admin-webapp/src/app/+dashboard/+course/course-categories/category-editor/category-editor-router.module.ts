// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
// local
import { CategoryEditorComponent } from './category-editor/category-editor.component';
import { CategoryEditorComponentRouter } from './category-editor-router.component';
import { FormWrapperMaterialModule } from 'ss-components/components/form';
// components
import { ListWrapperModule } from 'ss-components/components';

const materialModules = [
  MatListModule,
  MatTabsModule,
  MatIconModule,
  MatInputModule,
  MatCardModule,
  MatButtonModule
]

import { routes } from './category-editor-router.routes';

@NgModule({
  imports: [
    CommonModule,
    FormWrapperMaterialModule,
    ...materialModules,
    ListWrapperModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    CategoryEditorComponent,
    CategoryEditorComponentRouter
  ],
  declarations: [
    CategoryEditorComponent,
    CategoryEditorComponentRouter
  ],
  providers: []
})
export class CategoryEditorModule { }
