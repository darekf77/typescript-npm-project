import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonIconComponent } from './button-icon.component';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


const materialModules = [
  MatButtonModule,
  MatIconModule,

];

@NgModule({
  imports: [
    CommonModule,
    ...materialModules
  ],
  declarations: [ButtonIconComponent],
  exports: [ButtonIconComponent]
})
export class ButtonIconModule { }
