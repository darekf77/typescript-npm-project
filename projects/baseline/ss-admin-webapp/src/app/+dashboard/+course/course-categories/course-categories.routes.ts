import {
    Routes, RouterModule
} from '@angular/router';

import { CourseCategoriesComponent } from './course-categories.component';
import { CategoryEditorComponent } from './category-editor/category-editor.component';
import { CourseCategoriesListComponent }
    from './course-categories-list/course-categories-list.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "prefix",
        component: CourseCategoriesComponent,
        data: {
            breadcrumbs: 'Category'
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
                component: CategoryEditorComponent,
                data: {
                    breadcrumbs: 'Details'
                }
            }
        ]
    }
];
