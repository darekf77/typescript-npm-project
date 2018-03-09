import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";

// local
import { SliderVerticalComponent } from './slider-vertical.component';


const modules = [
  CommonModule,
  MatCardModule
]

@NgModule({
  imports: [modules],
  exports: [modules, SliderVerticalComponent],
  declarations: [SliderVerticalComponent],
  providers: [],
})
export class SliderVerticalModule { }
