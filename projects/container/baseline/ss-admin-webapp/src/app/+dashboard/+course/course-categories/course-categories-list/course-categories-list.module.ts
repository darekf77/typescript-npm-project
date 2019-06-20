import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// local
import { CourseCategoriesListComponent } from './course-categories-list.component';
// material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { ListWrapperModule } from 'ss-common-ui/browser-for-ss-admin-webapp';

const materialModules = [
  MatListModule,
  MatIconModule,
  MatCardModule
];

@NgModule({
  imports: [
    CommonModule,
    ...materialModules,
    RouterModule.forChild([]),
    ListWrapperModule
  ],
  exports: [
    CourseCategoriesListComponent
  ],
  declarations: [CourseCategoriesListComponent]
})
export class CourseCategoriesListModule { }
