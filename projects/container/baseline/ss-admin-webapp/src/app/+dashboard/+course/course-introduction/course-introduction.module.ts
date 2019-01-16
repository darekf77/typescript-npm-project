import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CourseIntroductionComponent } from './course-introduction.component';
import { RouterModule } from '@angular/router';
import { routes } from './course-introduction.routes';
import { NgxEditorModule } from 'ngx-editor';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgxEditorModule,
    HttpClientModule,
    RouterModule.forChild(routes),
  ],
  providers: [
    // HttpClient
  ],
  declarations: [CourseIntroductionComponent]
})
export class CourseIntroductionModule { }
