import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { StreetComponent } from './street.component';
import { routes } from "./street.routes";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [StreetComponent]
})
export class StreetModule { }
