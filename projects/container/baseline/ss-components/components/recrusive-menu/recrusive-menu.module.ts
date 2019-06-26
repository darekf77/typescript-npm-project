import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecrusiveMenuComponent } from './recrusive-menu.component';
import { NgPipesModule } from 'ngx-pipes';

@NgModule({
  exports: [
    RecrusiveMenuComponent
  ],
  imports: [
    NgPipesModule,
    CommonModule
  ],
  declarations: [RecrusiveMenuComponent]
})
export class RecrusiveMenuModule { }
``
