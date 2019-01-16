import {
    Routes, RouterModule
} from '@angular/router';

import { CourseComponent } from './course.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "prefix",
        component: CourseComponent,
        data: {
            breadcrumbs: 'Course'
        },
        children: [
            {
                path: 'introduction',
                loadChildren: './course-introduction/course-introduction.module#CourseIntroductionModule'
            },
            {
                path: 'categories',
                loadChildren: './course-categories/course-categories.module#CourseCategoriesModule'
            }
        ]
    }
];
