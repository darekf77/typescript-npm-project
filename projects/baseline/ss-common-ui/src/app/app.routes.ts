import { Routes } from '@angular/router';
import { PreviewSliderVerticalComponent } from './preview-slider-vertical/preview-slider-vertical.component';
import { AppComponent } from './app.component';
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    children: [
      {
        path: 'layout-slider-vertical',
        loadChildren: 'app/preview-slider-vertical/preview-slider-vertical.module#PreviewSliderVerticalModule',
      },
      {
        path: 'previewcomponents',
        loadChildren: './preview-components/preview-components.module#PreviewComponentsModule',
      },
      {
        path: 'preview-layout-material',
        loadChildren: 'app/preview-layout-material/preview-layout-material.module#PreviewLayoutMaterialModule',
      }
    ]
  },

];
