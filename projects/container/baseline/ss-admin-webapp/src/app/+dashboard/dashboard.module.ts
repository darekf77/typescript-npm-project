
import { NgModule } from '@angular/core';
import { StaticColumnsModule } from 'static-columns/browser';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
//
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
// local
import { DashboardComponent } from './dashboard.component';
import { routes } from './dashboard.routes';

import { TabsModule } from 'ngx-bootstrap/tabs';
import { LoginModule } from '../login/login.module';
import { LayoutMaterialModule } from 'ss-common-ui/browser-for-ss-admin-webapp';
// third part
import { McBreadcrumbsModule } from 'ngx-breadcrumbs';

const modules = [
  LayoutMaterialModule,
  MatMenuModule,
  MatIconModule
]

@NgModule({
  imports: [
    StaticColumnsModule,
    RouterModule.forChild(routes),
    CommonModule,
    LoginModule,
    TabsModule.forRoot(),
    MatCardModule,
    McBreadcrumbsModule.forRoot(),
    ...modules
  ],
  exports: [
    ...modules
  ],
  declarations: [DashboardComponent]
})
export class DashboardModule { }
