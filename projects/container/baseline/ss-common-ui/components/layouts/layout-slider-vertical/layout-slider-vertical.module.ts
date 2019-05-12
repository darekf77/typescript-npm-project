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
import { LogoModule } from '../../ui-elements';
import { StaticColumnsModule } from 'static-columns';

const modules = [
  CommonModule,
  MatCardModule,
  LogoModule,
  StaticColumnsModule
];

const localCmp = [
  SliderVertivalChildComponent,
  SliderVerticalComponent,
  GoToChildVerticalSliderDirective
];

@NgModule({
  imports: [modules],
  exports: [modules, localCmp],
  declarations: [localCmp],
  providers: [],
})
export class SliderVerticalModule { }
