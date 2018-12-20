import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';

@Component({
  selector: 'app-preview-list-wrapper',
  templateUrl: './preview-list-wrapper.component.html',
  styleUrls: ['./preview-list-wrapper.component.scss']
})
export class PreviewListWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController) {

  }



  ngOnInit() {
    console.log('LIST WRAPPER ON ININT');
    setTimeout(async () => {
      // await this.exampleService.info().received.observable.take(1).toPromise();
      await this.exampleService.info2().received.observable.take(1).toPromise();
    });
  }

}
