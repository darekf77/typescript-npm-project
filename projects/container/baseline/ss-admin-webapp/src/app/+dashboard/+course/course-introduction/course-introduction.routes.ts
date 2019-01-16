import {
    Routes, RouterModule
} from '@angular/router';

import { CourseIntroductionComponent } from './course-introduction.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: "prefix",
        component: CourseIntroductionComponent,
        data: {
            breadcrumbs: 'Introduction'
        },
    }
];
