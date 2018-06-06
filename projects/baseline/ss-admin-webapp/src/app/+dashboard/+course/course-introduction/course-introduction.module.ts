import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseIntroductionComponent } from './course-introduction.component';
import { RouterModule } from '@angular/router';
import { routes } from './course-introduction.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  declarations: [CourseIntroductionComponent]
})
export class CourseIntroductionModule { }
