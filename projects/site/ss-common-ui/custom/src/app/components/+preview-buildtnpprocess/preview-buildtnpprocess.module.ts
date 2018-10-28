import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewBuildtnpprocessComponent } from './preview-buildtnpprocess.component';
import { routes } from './preview-buildtnpprocess.routes';
import { RouterModule } from '@angular/router';

const angularModules = [
  CommonModule,
  RouterModule.forChild(routes),
];

@NgModule({
  imports: [
    ...angularModules
  ],
  exports: [
    PreviewBuildtnpprocessComponent
  ],
  declarations: [PreviewBuildtnpprocessComponent]
})
export class PreviewBuildTnpProcesssModule { }
