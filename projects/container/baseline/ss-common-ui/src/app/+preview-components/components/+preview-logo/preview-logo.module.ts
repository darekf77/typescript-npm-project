import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewLogoComponent } from './preview-logo.component';
import { RouterModule } from '@angular/router';
import {
  LogoModule
} from 'ss-components/components';
import { ProcessTestModule } from 'ss-common-logic/src/apps/process/process-test/process-test.module'


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
