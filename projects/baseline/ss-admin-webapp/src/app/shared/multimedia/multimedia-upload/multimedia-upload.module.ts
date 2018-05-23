import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
// third part
import { MultimediaUploadComponent } from './multimedia-upload.component';
import { FileUploadModule } from 'ng2-file-upload';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    FileUploadModule
  ],
  exports: [
    FileUploadModule,
    MultimediaUploadComponent
  ],
  declarations: [MultimediaUploadComponent]
})
export class MultimediaUploadModule { }
