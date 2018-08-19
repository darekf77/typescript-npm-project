import {
  Routes, RouterModule
} from '@angular/router';
import { DialogsGroupsComponent } from './dialogs-groups.component';
import { DialogsGroupsEditorComponent } from './dialogs-groups-editor';


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
          breadcrumbs: 'Dialogs Editor'
        },
      }
    ]
  }
];
