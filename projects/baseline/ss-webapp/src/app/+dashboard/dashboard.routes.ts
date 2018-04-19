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
            { path: '', pathMatch: 'full', redirectTo: 'date' },
            {
                path: 'date',
                loadChildren: './categories/date/date.module#DateModule'
            },
            {
                path: 'street',
                loadChildren: './categories/street/street.module#StreetModule'
            }
        ]
    }
];
