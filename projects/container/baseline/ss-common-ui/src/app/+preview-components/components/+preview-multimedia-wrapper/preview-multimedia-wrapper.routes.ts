import { Routes } from '@angular/router';
import { PreviewMultimediaWrapperComponent } from './preview-multimedia-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewMultimediaWrapperComponent,
  }
];
