import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewLogoComponent } from './preview-logo.component';
import { RouterModule } from '@angular/router';
import {
  LogoModule
} from 'components';


@NgModule({
  imports: [
    CommonModule,
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
