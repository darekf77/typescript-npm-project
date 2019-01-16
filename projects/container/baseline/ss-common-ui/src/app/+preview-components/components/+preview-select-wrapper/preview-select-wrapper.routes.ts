import { Routes } from '@angular/router';
import { PreviewSelectWrapperComponent } from './preview-select-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewSelectWrapperComponent,
  }
];
