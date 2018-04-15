// angular
import { NgModule, NgZone, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// local modules
import {
  BarService,
  FooComponent
} from './ui-elements';
// exports
export * from './layouts';
export * from './ui-elements';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    FooComponent
  ],
  exports: [
    FooComponent
  ]
})
export class CommonUIModule {

  public static forRoot(): ModuleWithProviders {

    return {
      ngModule: CommonUIModule,
      providers: [
        BarService
      ]
    };
  }
}
