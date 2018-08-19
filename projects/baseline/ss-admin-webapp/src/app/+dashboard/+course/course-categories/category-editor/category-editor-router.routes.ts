import {
  Routes, RouterModule
} from '@angular/router';
import { CategoryEditorComponentRouter } from './category-editor-router.component';
import { CategoryEditorComponent } from './category-editor/category-editor.component';
import { GroupResolver } from '../resolver-group';

export const routes: Routes = [
  {
    path: '',
    pathMatch: "prefix",
    component: CategoryEditorComponentRouter,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: CategoryEditorComponent
      },
      {
        path: 'groups/:groupid',
        loadChildren: './dialogs-groups/dialogs-groups.module#DialogsGroupsModule'
      }
    ]
  }
];
