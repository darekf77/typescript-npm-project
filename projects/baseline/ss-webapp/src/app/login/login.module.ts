
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { ModalModule } from 'ngx-bootstrap/modal';

import { LoginComponent } from './login.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// third part
import { StaticColumnsModule } from "static-columns";



@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild([]),
        ModalModule.forRoot(),
        // thrid part
        StaticColumnsModule
    ],
    exports: [LoginComponent],
    declarations: [LoginComponent]
})
export class LoginModule { }

