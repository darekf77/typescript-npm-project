import {
    Routes, RouterModule
} from '@angular/router';

import { CourseComponent } from './course.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "prefix",
        component: CourseComponent
    },
    {
        path: 'introduction',
        pathMatch: 'prefix',
        loadChildren: './course-introduction/course-introduction.module#CourseIntroductionModule'
    },
    {
        path: 'categories',
        pathMatch: 'prefix',
        loadChildren: './course-categories/course-categories.module#CourseCategoriesModule'
    }
];
