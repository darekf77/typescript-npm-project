// angular
import { Component, OnInit } from '@angular/core';
// fromly
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// local
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';
import { ProcessController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/core/ProcessController';

@Component({
  selector: 'app-preprocess-logger',
  templateUrl: './preview-process-logger.component.html',
  styleUrls: ['./preview-process-logger.component.scss']
})
export class PreviewProcessLoggerComponent implements OnInit {

  model: PROCESS[];

  fields: FormlyFieldConfig[];


  constructor(public processController: ProcessController) { }

  async ngOnInit() {
    this.model = await PROCESS.getAll();
    console.log('model', this.model);
  }

}
