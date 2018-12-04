
import { NgModule } from '@angular/core';
import { StaticColumnsModule } from "static-columns";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { DashboardComponent } from './dashboard.component';
import { routes } from "./dashboard.routes";
import { CategoryController } from "ss-common-logic/browser-for-ss-webapp/controllers/CategoryController";
import { TabsModule } from 'ngx-bootstrap/tabs';
import { LoginModule } from '../login/login.module';
import { DialogsConversationEditorModule } from 'ss-common-ui/module';

@NgModule({
    imports: [
        StaticColumnsModule,
        RouterModule.forChild(routes),
        CommonModule,
        LoginModule,
        DialogsConversationEditorModule,
        TabsModule.forRoot()
    ],
    exports: [],
    declarations: [DashboardComponent],
    providers: [CategoryController],
})
export class DashboardModule { }
