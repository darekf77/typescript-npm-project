import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from '@angular/material/card'
// local
import { WorkspaceDomainsComponent } from './workspace-domains.component';
import { routes } from './workspace-domains.routes';

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
  declarations: [WorkspaceDomainsComponent]
})
export class WorkspaceDomainsModule { }
