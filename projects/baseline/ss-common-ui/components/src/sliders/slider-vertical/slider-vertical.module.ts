import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
// third part
// local
import { SliderVerticalComponent } from './slider-vertical.component';
import { SliderVertivalChildComponent } from './child/slider-vertival-child.component';


const modules = [
  CommonModule,
  MatCardModule
];

const components = [
  SliderVertivalChildComponent,
  SliderVerticalComponent
]

@NgModule({
  imports: [modules],
  exports: [modules, components],
  declarations: [components],
  providers: [],
})
export class SliderVerticalModule { }
