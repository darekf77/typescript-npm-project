import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewCommonLoginComponent } from './preview-common-login.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'prefix',
        component: PreviewCommonLoginComponent,
      }
    ])
  ],
  declarations: [PreviewCommonLoginComponent]
})
export class PreviewCommonLoginModule { }
