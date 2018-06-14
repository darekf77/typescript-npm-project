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
        path: 'tablewrapper',
        loadChildren: './+preview-table-wrapper/preview-table-wrapper.module#PreviewTableWrapperModule'
      },
    ]
  }
];
