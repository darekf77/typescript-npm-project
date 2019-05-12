// angular
import { NgModule, NgZone, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// local modules
import {
  SliderVerticalSectionComponent
} from './ui-elements';

// exports
export * from './layouts';
export * from './ui-elements';
export * from './formly';
export * from './helpers';

const CMP = [
  SliderVerticalSectionComponent
];

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ...CMP
  ],
  exports: [
    ...CMP
  ]
})
export class CommonUIModule {

  public static forRoot(): ModuleWithProviders {

    return {
      ngModule: CommonUIModule,
      providers: [

      ]
    };
  }
}
