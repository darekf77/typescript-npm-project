import {
    Routes, RouterModule
} from '@angular/router';

import { CourseCategoriesComponent } from './course-categories.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "prefix",
        component: CourseCategoriesComponent
    }
];
