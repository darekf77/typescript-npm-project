import {
  Routes, RouterModule
} from '@angular/router';
import { DialogsGroupsComponent } from './dialogs-groups.component';
import { DialogsGroupsEditorComponent } from './dialogs-groups-editor';
import { GroupResolver } from '../../resolver-group';


export const routes: Routes = [
  {
    path: '',
    pathMatch: "prefix",
    component: DialogsGroupsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: DialogsGroupsEditorComponent,
        data: {
          // Interpolates values resolved by the router
          breadcrumbs: 'Group ( "{{ group.title }}" )'
        },
        resolve: {
          group: GroupResolver
        }
      }
    ]
  }
];
