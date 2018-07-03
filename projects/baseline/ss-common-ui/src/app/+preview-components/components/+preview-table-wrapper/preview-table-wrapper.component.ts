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
    setTimeout(async () => {
      // await this.exampleService.info().received.observable.take(1).toPromise();
      await this.exampleService.info2().received.observable.take(1).toPromise();
    });
  }

}
