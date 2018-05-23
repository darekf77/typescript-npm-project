import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
// third part
import { MultimediaUploadComponent } from './multimedia-upload.component';
import { FileUploadModule } from 'ng2-file-upload';
import { StaticColumnsModule } from "static-columns";
import { NgxDatatableModule } from "@swimlane/ngx-datatable";

const materialModules = [
  MatDialogModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatInputModule,
  MatFormFieldModule
]

@NgModule({
  imports: [
    CommonModule,
    ...materialModules,
    FileUploadModule,
    StaticColumnsModule,
    NgxDatatableModule
  ],
  exports: [
    FileUploadModule,
    MultimediaUploadComponent
  ],
  declarations: [MultimediaUploadComponent]
})
export class MultimediaUploadModule { }
