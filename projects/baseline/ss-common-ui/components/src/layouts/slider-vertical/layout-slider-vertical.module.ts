import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
// third part
// local
import { SliderVerticalComponent } from './layout-slider-vertical.component';
import { GoToChildVerticalSliderDirective } from './goto-child.directive';
import {
  SliderVertivalChildComponent
} from './layout-slider-vertical-child/layout-slider-vertical-child.component';

const modules = [
  CommonModule,
  MatCardModule
];

const components = [
  SliderVertivalChildComponent,
  SliderVerticalComponent,
  GoToChildVerticalSliderDirective
];

@NgModule({
  imports: [modules],
  exports: [modules, components],
  declarations: [components],
  providers: [],
})
export class SliderVerticalModule { }
