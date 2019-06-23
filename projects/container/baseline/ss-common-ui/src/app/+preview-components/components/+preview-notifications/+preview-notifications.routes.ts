import { Routes } from '@angular/router';
import { PreviewNotificaitonsComponent } from './+preview-notifications.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewNotificaitonsComponent,
  }
];
