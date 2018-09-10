import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogPrcessComponent } from './log-prcess.component';
// material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';

const materialModules = [
  MatButtonModule,
  MatIconModule,
  MatDialogModule,
  MatSlideToggleModule
];


@NgModule({
  imports: [
    CommonModule,
    ...materialModules
  ],
  exports: [
    LogPrcessComponent,
  ],
  declarations: [LogPrcessComponent]
})
export class LogPrcessModule { }
