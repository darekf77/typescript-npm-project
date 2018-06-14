import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    children: [
      {
        path: 'layout-slider-vertical',
        loadChildren: './+preview-slider-vertical/preview-slider-vertical.module#PreviewSliderVerticalModule',
      },
      {
        path: 'previewcomponents',
        loadChildren: './+preview-components/preview-components.module#PreviewComponentsModule',
      },
      {
        path: 'preview-layout-material',
        loadChildren: './+preview-layout-material/preview-layout-material.module#PreviewLayoutMaterialModule',
      }
    ]
  },

];
