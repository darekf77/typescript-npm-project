import {
  Routes, RouterModule
} from '@angular/router';

import { DashboardComponent } from './dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {
      breadcrumbs: 'Dashboard'
    },
    children: [
      {
        path: 'builds',
        loadChildren: './workspace-builds/workspace-builds.module#WorkspaceBuildsModule'
      },
      // {
      //   path: 'domains',
      //   loadChildren: './workspace-domains/workspace-domains.module#WorkspaceDomainsModule'
      // }
    ]
  }
];
