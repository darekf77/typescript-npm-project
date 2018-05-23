import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';

// material
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";

import { FileUploader } from 'ng2-file-upload';
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { SESSION } from 'ss-common-logic/browser/entities/core/SESSION';
const URL = `${ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host}/MultimediaController/upload`;

@Component({
  selector: 'app-multimedia-upload',
  templateUrl: './multimedia-upload.component.html',
  styleUrls: ['./multimedia-upload.component.scss']
})
export class MultimediaUploadComponent implements OnInit {

  @ViewChild('dialog')
  private dialog: TemplateRef<any>;

  constructor(
    private auth: AuthController
  ) {

  }

  rows = []
  columns = [];

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

    this.columns = [
      {
        prop: 'name'
      },
      {
        prop: 'gender'
      }
    ]
    this.rows = [
      {
        "name": "Ethel Price",
        "gender": "female",
        "company": "Johnson, Johnson and Partners, LLC CMP DDC",
        "age": 22
      },
      {
        "name": "Claudine Neal",
        "gender": "female",
        "company": "Sealoud",
        "age": 55
      },
      {
        "name": "Beryl Rice",
        "gender": "female",
        "company": "Velity",
        "age": 67
      }
    ]
  }

  public uploader: FileUploader;

  public hasBaseDropZoneOver: boolean = false;
  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }


}
