import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseCategoriesComponent } from './course-categories.component';
import { RouterModule } from '@angular/router';
import { routes } from './course-categories.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  declarations: [CourseCategoriesComponent]
})
export class CourseCategoriesModule { }
