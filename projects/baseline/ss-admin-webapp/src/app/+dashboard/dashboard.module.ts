
import { NgModule } from '@angular/core';
import { StaticColumnsModule } from "static-columns";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
//
import { MatCardModule } from "@angular/material/card";
// local
import { DashboardComponent } from './dashboard.component';
import { routes } from "./dashboard.routes";
import { CategoryController } from "ss-common-logic/browser/controllers/CategoryController";
import { TabsModule } from 'ngx-bootstrap/tabs';
import { LoginModule } from '../login/login.module';
import { LayoutMaterialModule } from "ss-common-ui/module/layouts";

@NgModule({
    imports: [
        StaticColumnsModule,
        RouterModule.forChild(routes),
        CommonModule,
        LoginModule,
        TabsModule.forRoot(),
        MatCardModule,
        LayoutMaterialModule
    ],
    exports: [],
    declarations: [DashboardComponent],
    providers: [CategoryController],
})
export class DashboardModule { }
