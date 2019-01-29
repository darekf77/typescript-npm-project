import { Routes } from '@angular/router';
import { PreviewProcessLoggerComponent } from './preview-process-logger.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewProcessLoggerComponent,
  }
];
