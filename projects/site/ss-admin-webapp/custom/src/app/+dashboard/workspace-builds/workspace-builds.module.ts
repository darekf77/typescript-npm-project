import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { WorkspaceBuildsComponent } from './workspace-builds.component';
import { routes } from './workspace-builds.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    WorkspaceBuildsComponent
  ],
  declarations: [WorkspaceBuildsComponent]
})
export class WorkspaceBuildsModule { }
