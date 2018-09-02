import { Routes } from '@angular/router';
import { PreviewEditorWrapperComponent } from './+preview-editor-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewEditorWrapperComponent,
  }
];
