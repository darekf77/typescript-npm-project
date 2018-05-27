import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule } from "@angular/material/dialog";

import { DialogWrapperComponent } from './dialog-wrapper.component';


@NgModule({
    imports: [
        MatIconModule,
        MatDialogModule,
        CommonModule],
    exports: [DialogWrapperComponent],
    declarations: [DialogWrapperComponent]
})
export class DialogWrapperModule { }

