import { Routes } from '@angular/router';
import { PreviewComponents } from './preview-components.component';
export const routes: Routes = [
    {
        path: '',
        pathMatch: 'prefix',
        component: PreviewComponents
    }
]
