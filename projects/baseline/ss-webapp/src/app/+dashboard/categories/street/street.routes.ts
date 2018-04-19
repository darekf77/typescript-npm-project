import { StreetComponent } from "./street.component";

import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'prefix',
        component: StreetComponent
    }
]
