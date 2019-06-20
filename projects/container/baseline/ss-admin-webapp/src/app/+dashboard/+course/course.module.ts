import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseComponent } from './course.component';
import { RouterModule } from '@angular/router';
import { routes } from './course.routes';
import { MatCardModule } from '@angular/material/card';


const modulesMaterial = [
  MatCardModule
]

@NgModule({
  imports: [
    CommonModule,
    ...modulesMaterial,
    RouterModule.forChild(routes),
  ],
  declarations: [CourseComponent]
})
export class CourseModule { }
