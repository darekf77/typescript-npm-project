import {
  Routes, RouterModule
} from '@angular/router';

import { WorkspaceBuildsComponent } from './workspace-builds.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: "prefix",
    component: WorkspaceBuildsComponent,
    data: {
      breadcrumbs: 'Builds'
    }
  }
];
