import { Routes } from '@angular/router';
import { PreviewSliderVerticalComponent } from './preview-slider-vertical/preview-slider-vertical.component';
export const previewRoutes: Routes = [
  { path: '', redirectTo: 'layout-slider-vertical', pathMatch: 'full' },
  {
    path: 'layout-slider-vertical',
    loadChildren: 'preview/preview-slider-vertical/preview-slider-vertical.module#PreviewSliderVerticalModule',
  },
  {
    path: 'preview-components',
    loadChildren: 'preview/preview-components/preview-components.module#PreviewComponentsModule',
  },
  {
    path: 'preview-layout-material',
    loadChildren: 'preview/preview-layout-material/preview-layout-material.module#PreviewLayoutMaterialModule',
  }
];
