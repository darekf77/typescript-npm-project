import { Component, OnInit } from '@angular/core';

import { FileUploader } from 'ng2-file-upload';
const URL = 'http://localhost:4000/MultimediaController/upload';

@Component({
  selector: 'app-multimedia-upload',
  templateUrl: './multimedia-upload.component.html',
  styleUrls: ['./multimedia-upload.component.scss']
})
export class MultimediaUploadComponent implements OnInit {

  ngOnInit() {
    console.log('ENV', ENV)
  }

  public uploader: FileUploader = new FileUploader({ url: URL });
  public hasBaseDropZoneOver: boolean = false;
  public hasAnotherDropZoneOver: boolean = false;

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

}
