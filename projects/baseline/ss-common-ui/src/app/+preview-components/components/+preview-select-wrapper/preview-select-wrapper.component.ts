import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';

@Component({
  selector: 'app-preview-select-wrapper',
  templateUrl: './preview-select-wrapper.component.html',
  styleUrls: ['./preview-select-wrapper.component.scss']
})
export class PreviewSelectWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController) {

  }



  ngOnInit() {
    setTimeout(async () => {
      // await this.exampleService.info().received.observable.take(1).toPromise();
      await this.exampleService.info2().received.observable.take(1).toPromise();
    });
  }

}
