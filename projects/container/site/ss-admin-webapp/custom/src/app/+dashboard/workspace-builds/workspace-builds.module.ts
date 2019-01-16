import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from '@angular/material/card'
// local
import { WorkspaceBuildsComponent } from './workspace-builds.component';
import { routes } from './workspace-builds.routes';

const materialModules = [
  MatCardModule
]

const angularModules = [
  CommonModule,
  RouterModule.forChild(routes),
]


@NgModule({
  imports: [
    ...angularModules,
    ...materialModules
  ],
  exports: [
    WorkspaceBuildsComponent
  ],
  declarations: [WorkspaceBuildsComponent]
})
export class WorkspaceBuildsModule { }
