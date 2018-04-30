import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

// third part
// local
import { LayoutMaterialComponent } from './layout-material.component';

const modules = [
  CommonModule,
  MatCardModule
];

const components = [
  LayoutMaterialComponent
];

@NgModule({
  imports: [modules],
  exports: [modules, components],
  declarations: [components],
  providers: [],
})
export class LayoutMaterialModule { }
