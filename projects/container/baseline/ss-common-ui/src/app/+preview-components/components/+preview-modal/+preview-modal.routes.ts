import { Routes } from '@angular/router';
import { PreviewModalComponent } from './+preview-modal.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewModalComponent,
  }
];
