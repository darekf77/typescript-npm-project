import { Routes } from '@angular/router';
import { PreviewComponents } from './preview-components.component';
import { ComponentsMenuItem } from '../../../components/src/layouts/layout-components-list-docs/layout-components-list-docs.component';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: PreviewComponents,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tablewrapper'
      },
      {
        path: 'tablewrapper',
        loadChildren: './components/+preview-table-wrapper/preview-table-wrapper.module#PreviewTableWrapperModule'
      },
      {
        path: 'commonlogin',
        loadChildren: './components/+preview-common-login/preview-common-login.module#PreviewCommonLoginModule'
      },
    ]
  }
];
