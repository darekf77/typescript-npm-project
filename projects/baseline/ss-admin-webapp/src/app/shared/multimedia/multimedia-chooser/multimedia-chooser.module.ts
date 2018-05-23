import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultimediaChooserComponent } from './multimedia-chooser.component';
import { NgxDatatableModule } from "@swimlane/ngx-datatable";

@NgModule({
  imports: [
    CommonModule,
    NgxDatatableModule
  ],
  exports: [
    MultimediaChooserComponent
  ],
  declarations: [MultimediaChooserComponent]
})
export class MultimediaChooserModule { }
