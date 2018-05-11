
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';

import { LoginComponent } from './login.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// material
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

// third part
import { StaticColumnsModule } from "static-columns";


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        // material
        MatToolbarModule,
        MatButtonModule,
        MatListModule,
        MatInputModule,
        MatFormFieldModule,
        // thrid part
        StaticColumnsModule
    ],
    exports: [LoginComponent],
    declarations: [LoginComponent]
})
export class LoginModule { }

