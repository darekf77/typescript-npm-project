import { Routes } from '@angular/router';
import { PreviewListWrapperComponent } from './preview-list-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewListWrapperComponent,
  }
];
