import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
// third part
import { StaticColumnsModule } from "static-columns";
// local
import { LayoutMaterialComponent } from './layout-material.component';

const modules = [
  CommonModule,
  // other modules
  StaticColumnsModule,
  // material modules
  MatCardModule,
  MatTabsModule,
  MatExpansionModule
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
