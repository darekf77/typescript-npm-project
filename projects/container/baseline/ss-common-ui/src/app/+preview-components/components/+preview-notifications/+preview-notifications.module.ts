import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewNotificaitonsComponent } from './+preview-notifications.component';
import { RouterModule } from '@angular/router';

import { ModalModule, NotificationsModule } from 'ss-components/components';
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';

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
  declarations: [PreviewNotificaitonsComponent],
  providers: [ExamplesController]
})
export class PreviewNotificationsModule { }
