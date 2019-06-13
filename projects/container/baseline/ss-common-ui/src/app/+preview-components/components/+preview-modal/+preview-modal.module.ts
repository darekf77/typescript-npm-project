import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewModalComponent } from './+preview-modal.component';
import { RouterModule } from '@angular/router';

import { ModalModule } from 'components';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'prefix',
        component: PreviewModalComponent,
      }
    ]),
    ModalModule
  ],
  exports: [PreviewModalComponent],
  declarations: [PreviewModalComponent]
})
export class PreviewModalModule { }
