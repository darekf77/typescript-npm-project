import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseCategoriesComponent } from './course-categories.component';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { routes } from './course-categories.routes';
import { CourseCategoriesListModule } from './course-categories-list/course-categories-list.module';
import { CategoryResolver } from './resolver-category';
import { GroupResolver } from './resolver-group';


const materialModules = [
  MatListModule, MatIconModule
]
@NgModule({
  imports: [
    CommonModule,
    ...materialModules,
    CourseCategoriesListModule,
    RouterModule.forChild(routes),
  ],
  declarations: [CourseCategoriesComponent],
  providers:[
    CategoryResolver,
    GroupResolver
  ]
})
export class CourseCategoriesModule { }
