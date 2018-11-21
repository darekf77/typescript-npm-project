import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelfUpdateComponent } from './self-update.component';

// material
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatRadioModule } from '@angular/material/radio'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

const materialModules = [
  MatSlideToggleModule,
  MatProgressBarModule,
  MatExpansionModule,
  MatRadioModule,
  MatButtonModule,
  MatIconModule,
  MatTooltipModule
]


@NgModule({
  imports: [
    CommonModule,
    ...materialModules
  ],
  exports: [SelfUpdateComponent],
  declarations: [SelfUpdateComponent]
})
export class SelfUpdateModule { }
