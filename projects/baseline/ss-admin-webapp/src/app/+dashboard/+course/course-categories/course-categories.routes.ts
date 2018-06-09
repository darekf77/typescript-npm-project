import {
    Routes, RouterModule
} from '@angular/router';

import { CourseCategoriesComponent } from './course-categories.component';
import { CategoryEditorComponent } from './category-editor/category-editor.component';
import { CategoriesResolver } from './model/categories.resolve';
import { CategoryResolver } from './model/categorie.resolve';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "prefix",
        component: CourseCategoriesComponent,
        children: [
            {
                path: 'category/:id',
                component: CategoryEditorComponent
            }
        ]
    }
];
