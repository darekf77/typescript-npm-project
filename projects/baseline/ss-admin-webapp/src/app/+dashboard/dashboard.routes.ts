import {
    Routes, RouterModule
} from '@angular/router';

import { DashboardComponent } from './dashboard.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "prefix",
        component: DashboardComponent,
        children: [
            {
                path: 'course',
                loadChildren: './+course/course.module#CourseModule'
            }
        ]
    }
];
