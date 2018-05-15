import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultimediaUploadComponent } from './multimedia-upload.component';
import { FileUploadModule } from 'ng2-file-upload';

@NgModule({
  imports: [
    CommonModule,
    FileUploadModule
  ],
  exports: [
    FileUploadModule,
    MultimediaUploadComponent
  ],
  declarations: [MultimediaUploadComponent]
})
export class MultimediaUploadModule { }
