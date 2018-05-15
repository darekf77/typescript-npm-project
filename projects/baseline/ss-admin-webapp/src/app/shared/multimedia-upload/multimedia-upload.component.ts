import { Component, OnInit } from '@angular/core';

import { FileUploader } from 'ng2-file-upload';
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { SESSION } from 'ss-common-logic/browser/entities/core/SESSION';
const URL = 'http://localhost:4000/MultimediaController/upload';

@Component({
  selector: 'app-multimedia-upload',
  templateUrl: './multimedia-upload.component.html',
  styleUrls: ['./multimedia-upload.component.scss']
})
export class MultimediaUploadComponent implements OnInit {

  constructor(private auth: AuthController) {

  }

  ngOnInit() {
    console.log('ENV', ENV)
    this.auth.isLoggedIn.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        let headers = [SESSION.localStorage.fromLocalStorage().activationTokenHeader]
        this.uploader = new FileUploader({ url: URL, headers });
        this.uploader.onBeforeUploadItem = (item) => { item.withCredentials = false; console.log(item); };
      }
    })
    this.auth.browser.init()
  }

  public uploader: FileUploader;

  public hasBaseDropZoneOver: boolean = false;
  public hasAnotherDropZoneOver: boolean = false;

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

}
