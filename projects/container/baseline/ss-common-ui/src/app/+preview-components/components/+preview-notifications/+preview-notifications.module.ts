import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewNotificaitonsComponent } from './+preview-notifications.component';
import { RouterModule } from '@angular/router';

import { ModalModule, NotificationsModule } from 'ss-components/components';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'prefix',
        component: PreviewNotificaitonsComponent,
      }
    ]),
    ModalModule,
    NotificationsModule
  ],
  exports: [PreviewNotificaitonsComponent],
  declarations: [PreviewNotificaitonsComponent]
})
export class PreviewNotificationsModule { }
