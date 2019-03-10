import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecrusiveMenuComponent } from './recrusive-menu.component';

@NgModule({
  exports: [
    RecrusiveMenuComponent
  ],
  imports: [
    CommonModule
  ],
  declarations: [RecrusiveMenuComponent]
})
export class RecrusiveMenuModule { }
