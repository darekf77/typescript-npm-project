import { Routes } from '@angular/router';
import { PreviewTableWrapperComponent } from './preview-table-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewTableWrapperComponent,
  }
];
