import { Routes } from '@angular/router';
import { PreviewDialogFieldComponent } from './+preview-dialog-field.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewDialogFieldComponent,
  }
];
