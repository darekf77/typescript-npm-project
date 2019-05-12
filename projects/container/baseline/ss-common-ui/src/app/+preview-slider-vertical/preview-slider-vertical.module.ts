
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { PreviewSliderVerticalComponent } from './preview-slider-vertical.component';
import { routes } from './preview-slider-vertical.routes';
import {
  SliderVerticalModule
} from 'ss-common-ui/module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SliderVerticalModule
  ],
  declarations: [PreviewSliderVerticalComponent],
  providers: [],
})
export class PreviewSliderVerticalModule { }

