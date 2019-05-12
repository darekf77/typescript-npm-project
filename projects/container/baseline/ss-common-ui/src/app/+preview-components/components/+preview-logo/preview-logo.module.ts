import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewLogoComponent } from './preview-logo.component';
import { RouterModule } from '@angular/router';
import {
  LogoModule
} from 'ss-common-ui/module/ui-elements/logo';
import { ProcessTestModule } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/process-test/process-test.module'


@NgModule({
  imports: [
    CommonModule,
    ProcessTestModule,
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'prefix',
        component: PreviewLogoComponent,
      }
    ]),
    LogoModule
  ],
  declarations: [PreviewLogoComponent]
})
export class PreviewLogoModule { }
