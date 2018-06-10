import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseCategoriesListComponent } from './course-categories-list.component';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

const materialModules = [
  MatListModule, MatIconModule
]

@NgModule({
  imports: [
    CommonModule,
    ...materialModules,
    RouterModule.forChild([]),
  ],
  exports: [
    CourseCategoriesListComponent
  ],
  declarations: [CourseCategoriesListComponent]
})
export class CourseCategoriesListModule { }
