import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseCategoriesComponent } from './course-categories.component';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { routes } from './course-categories.routes';
import { CategoryEditorModule } from './category-editor/category-editor.module';
import { CourseCategoriesListModule } from './course-categories-list/course-categories-list.module';


const materialModules = [
  MatListModule, MatIconModule
]
@NgModule({
  imports: [
    CommonModule,
    CategoryEditorModule,
    ...materialModules,
    CourseCategoriesListModule,
    RouterModule.forChild(routes),
  ],
  declarations: [CourseCategoriesComponent],
  providers:[

  ]
})
export class CourseCategoriesModule { }
