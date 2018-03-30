import { Routes } from '@angular/router';
import { SliderVerticalComponent } from './preview-slider-vertical/preview-slider-vertical.component';
export const previewRoutes: Routes = [
    { path: '', redirectTo: 'layout-slider-vertical', pathMatch: 'full' },
    {
        path: 'layout-slider-vertical',
        component: SliderVerticalComponent
    }
];
