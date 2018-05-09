
import { NgModule } from '@angular/core';
import { StaticColumnsModule } from "static-columns";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { DashboardComponent } from './dashboard.component';
import { routes } from "./dashboard.routes";
import { CategoryController } from "ss-common-logic/browser/controllers/CategoryController";
import { TabsModule } from 'ngx-bootstrap/tabs';


@NgModule({
    imports: [
        StaticColumnsModule,
        RouterModule.forChild(routes),
        CommonModule,
        TabsModule.forRoot()
    ],
    exports: [],
    declarations: [DashboardComponent],
    providers: [CategoryController],
})
export class DashboardModule { }
