
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewLayoutMaterialComponent } from './preview-layout-material.component';
import { routes } from './preview-layout-material.routes';
import {
  LayoutMaterialModule
} from 'components';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    RouterModule.forChild(routes),
    LayoutMaterialModule
  ],
  declarations: [PreviewLayoutMaterialComponent],
  providers: [],
})
export class PreviewLayoutMaterialModule { }

