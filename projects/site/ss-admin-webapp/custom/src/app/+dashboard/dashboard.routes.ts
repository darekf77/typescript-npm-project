import {
  Routes, RouterModule
} from '@angular/router';

import { DashboardComponent } from './dashboard.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: "prefix",
    component: DashboardComponent,
    data: {
      breadcrumbs: 'Dashboard'
    },
    children: [
      {
        path: 'builds',
        loadChildren: './workspace-builds/workspace-builds.module#WorkspaceBuildsModule'
      }
    ]
  }
];
