import { Routes } from '@angular/router';
import { PreviewFormWrapperComponent } from './preview-form-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewFormWrapperComponent,
  }
];
