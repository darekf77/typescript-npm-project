import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local 
import { DateComponent } from './date.component';
import { routes } from "./date.routes";


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DateComponent]
})
export class DateModule {

}
