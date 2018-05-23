import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-multimedia-chooser',
  templateUrl: './multimedia-chooser.component.html',
  styleUrls: ['./multimedia-chooser.component.scss']
})
export class MultimediaChooserComponent implements OnInit {

  @ViewChild('editTmpl') editTmpl: TemplateRef<any>;
  @ViewChild('hdrTpl') hdrTpl: TemplateRef<any>;

  rows = []
  columns = [];

  constructor() {

  }

  ngOnInit() {
    this.columns = [{
      cellTemplate: this.editTmpl,
      headerTemplate: this.hdrTpl,
      name: 'Gender'
    }];

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


}
