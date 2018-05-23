import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultimediaComponent } from './multimedia.component';
import { MatDialogModule } from "@angular/material/dialog";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTableModule } from "@angular/material/table";
import { CdkTableModule } from '@angular/cdk/table';
import { MultimediaChooserModule } from './multimedia-chooser/multimedia-chooser.module';
import { MultimediaUploadModule } from './multimedia-upload/multimedia-upload.module';

const moduleMaterial = [
  MatTabsModule,
  MatDialogModule,
  MultimediaChooserModule,
  MultimediaUploadModule
]

@NgModule({
  imports: [
    CommonModule,
    ...moduleMaterial
  ],
  exports: [
    MultimediaComponent
  ],
  declarations: [MultimediaComponent]
})
export class MultimediaModule { }
