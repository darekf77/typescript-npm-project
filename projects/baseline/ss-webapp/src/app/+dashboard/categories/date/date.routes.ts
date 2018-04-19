import { DateComponent } from "./date.component";
import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'prefix',
        component: DateComponent
    }
]