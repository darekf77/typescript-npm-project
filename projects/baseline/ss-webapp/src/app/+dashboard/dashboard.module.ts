
import { NgModule } from '@angular/core';
import { StaticColumnsModule } from "static-columns";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { DashboardComponent } from './dashboard.component';
import { routes } from "./dashboard.routes";

@NgModule({
    imports: [
        StaticColumnsModule,
        RouterModule.forChild(routes),
        CommonModule
    ],
    exports: [],
    declarations: [DashboardComponent],
    providers: [],
})
export class DashboardModule { }


