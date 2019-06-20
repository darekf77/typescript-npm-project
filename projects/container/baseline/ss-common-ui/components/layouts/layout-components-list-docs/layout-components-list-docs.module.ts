import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// material
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
// other
import { StaticColumnsModule } from 'static-columns';
import { NgArrayPipesModule } from 'ngx-pipes';
// local
import { LayoutComponentsListDocsComponent } from './layout-components-list-docs.component';

const materialModules = [
  MatTabsModule,
  MatCardModule,
  MatIconModule,
  MatListModule,
  MatInputModule,
  MatTooltipModule
];

const angularModules = [
  FormsModule,
  CommonModule,
  RouterModule.forChild([])
];

const otherModules = [
  StaticColumnsModule,
  NgArrayPipesModule
];

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    ...otherModules,
  ],
  exports: [
    LayoutComponentsListDocsComponent
  ],
  declarations: [LayoutComponentsListDocsComponent]
})
export class LayoutComponentsListDocsModule { }
