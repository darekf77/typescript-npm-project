import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';

@Component({
  selector: 'app-preview-table-wrapper',
  templateUrl: './preview-table-wrapper.component.html',
  styleUrls: ['./preview-table-wrapper.component.scss']
})
export class PreviewTableWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController) {

  }

  ngOnInit() {

  }

}
