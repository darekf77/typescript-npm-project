import { Routes } from '@angular/router';
import { PreviewFormlyInputsComponent } from './preview-formly-inputs.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewFormlyInputsComponent,
  }
];
