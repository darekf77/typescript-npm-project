import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import * as _ from 'lodash';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { getFormlyFrom } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
import { EXAMPLE } from 'ss-common-logic/browser/entities/EXAMPLE';

const log = Log.create('preview-form-wrapper');

@Component({
  selector: 'app-preview-form-wrapper',
  templateUrl: './preview-form-wrapper.component.html',
  styleUrls: ['./preview-form-wrapper.component.scss']
})
export class PreviewFormWrapperComponent implements OnInit {

  entity = EXAMPLE;
  model = {
    id: 23,
    test: 'asdasd',
    href: 'http://onet.pl'
  };

  fields = [
    {
      key: 'href',
      templateOptions: {
        required: true
      }
    }
  ];

  constructor(public exampleService: ExamplesController) {

  }


  async ngOnInit() {
    const models = await this.exampleService.getAll().received.observable.take(1).toPromise();
    this.model = models[0];
  }

}
