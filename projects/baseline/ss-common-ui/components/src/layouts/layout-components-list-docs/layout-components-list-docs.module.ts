import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponentsListDocsComponent } from './layout-components-list-docs.component';
// material
import { MatTabsModule } from "@angular/material/tabs";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatInputModule } from "@angular/material/input";
// other
import { StaticColumnsModule } from "static-columns";

const materialModules = [
  MatTabsModule,
  MatCardModule,
  MatIconModule,
  MatListModule,
  MatInputModule
];

const otherModules = [
  StaticColumnsModule
];

@NgModule({
  imports: [
    CommonModule,
    ...materialModules,
    ...otherModules
  ],
  exports: [
    LayoutComponentsListDocsComponent
  ],
  declarations: [LayoutComponentsListDocsComponent]
})
export class LayoutComponentsListDocsModule { }
