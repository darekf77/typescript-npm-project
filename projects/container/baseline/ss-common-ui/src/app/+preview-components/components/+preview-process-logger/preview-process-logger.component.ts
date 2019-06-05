// angular
import { Component, OnInit } from '@angular/core';
// fromly
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// local
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/PROCESS';
import { ProcessController } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/ProcessController';
import { ModelDataConfig } from 'morphi';

@Component({
  selector: 'app-preprocess-logger',
  templateUrl: './preview-process-logger.component.html',
  styleUrls: ['./preview-process-logger.component.scss']
})
export class PreviewProcessLoggerComponent implements OnInit {

  models1: PROCESS[];

  models2: PROCESS[];

  config = new ModelDataConfig({
    exclude: [
      'stderLog', 'browser.stderLog',
      'stdoutLog', 'browser.stdoutLog',
      'allProgressData', 'browser.allProgressData'
    ],
    pagination: {
      "pageNumber": 1, "rowsDisplayed": 5, "totalElements": 5
    }
  });



  constructor(public processController: ProcessController) { }

  async ngOnInit() {
    this.models1 = await PROCESS.getAll(this.config);
    this.models2 = await PROCESS.getAll(this.config);
    console.log('models1', this.models1);
    console.log('models2', this.models2);
  }

}
