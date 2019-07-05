import {
  Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot
} from '@angular/router';


import { CourseCategoriesComponent } from './course-categories.component';
import { CourseCategoriesListComponent } from './course-categories-list/course-categories-list.component';
import { CATEGORY } from 'ss-common-logic/src/apps/category/CATEGORY';
import { CategoryResolver } from './resolver-category';
import { GroupResolver } from './resolver-group';





export const routes: Routes = [
  {
    path: '',
    pathMatch: "prefix",
    component: CourseCategoriesComponent,
    data: {
      breadcrumbs: 'Categories'
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: CourseCategoriesListComponent,
        data: {
          breadcrumbs: 'List'
        }
      },
      {
        path: 'category/:id',
        loadChildren: './category-editor/category-editor-router.module#CategoryEditorModule',
        data: {
          // Interpolates values resolved by the router
          breadcrumbs: 'Category ("{{ category.name }}")'
        },
        resolve: {
          category: CategoryResolver
        }
      }
    ]
  }
];
