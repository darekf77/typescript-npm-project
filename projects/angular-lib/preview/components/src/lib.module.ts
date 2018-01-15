import { NgModule, NgZone, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooComponent } from './foo/foo.component';
import { BarService } from './bar/bar.service';

import { MatCardModule, MatCommonModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule
  ],
  declarations: [
    FooComponent
  ],
  exports: [
    FooComponent,
    MatCardModule
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
