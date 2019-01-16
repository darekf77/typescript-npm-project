import {
  Routes, RouterModule
} from '@angular/router';

import { WorkspaceBuildsComponent } from './workspace-builds.component';

export const routes: Routes = [
  {
    path: '',
    component: WorkspaceBuildsComponent,
    data: {
      breadcrumbs: 'Builds'
    },
    children: [
      {
        path: 'build/:id',
        loadChildren: './build-editor/build-editor.module#BuildEditorModule'
      }
    ]
  }
];
