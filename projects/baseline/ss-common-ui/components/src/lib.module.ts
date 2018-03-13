import { NgModule, NgZone, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooComponent } from './foo/foo.component';
import { BarService } from './bar/bar.service';
import { SliderVerticalModule } from "./sliders/slider-vertical/slider-vertical.module";

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatCardModule,
  MatSlideToggleModule
} from '@angular/material';

const modules = [
  SliderVerticalModule
]

@NgModule({
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatCardModule,
    modules
  ],
  declarations: [
    FooComponent
  ],
  exports: [
    modules,
    FooComponent,
    MatCardModule,
    MatSlideToggleModule
  ]
})
export class MyLibModule {

  public static forRoot(): ModuleWithProviders {

    return {
      ngModule: MyLibModule,
      providers: [
        BarService
      ]
    };
  }
}
