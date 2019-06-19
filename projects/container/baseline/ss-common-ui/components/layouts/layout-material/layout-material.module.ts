import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// third part
import { StaticColumnsModule } from 'static-columns';
// local
import { LayoutMaterialComponent } from './layout-material.component';
import { LogoModule } from '../../ui-elements';

const modules = [
  CommonModule,
  // other modules
  StaticColumnsModule,
  // material modules
  MatCardModule,
  MatTabsModule,
  MatExpansionModule,
  MatListModule,
  MatButtonModule,
  MatIconModule,
  // local modules
  LogoModule
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
