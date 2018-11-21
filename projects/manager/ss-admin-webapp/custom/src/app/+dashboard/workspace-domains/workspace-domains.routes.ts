import {
  Routes, RouterModule
} from '@angular/router';

import { WorkspaceDomainsComponent } from './workspace-domains.component';

export const routes: Routes = [
  {
    path: '',
    component: WorkspaceDomainsComponent,
    data: {
      breadcrumbs: 'Builds'
    },
    children: [
      {
        path: 'domain/:id',
        loadChildren: './domains-editor/domains-editor.module#DomainsEditorModule'
      }
    ]
  }
];
