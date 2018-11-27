import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';
import * as _ from 'lodash';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { getFormlyFrom } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/entities/EXAMPLE';

const log = Log.create('preview-form-wrapper');

@Component({
  selector: 'app-preview-form-wrapper',
  templateUrl: './preview-form-wrapper.component.html',
  styleUrls: ['./preview-form-wrapper.component.scss']
})
export class PreviewFormWrapperComponent implements OnInit {

  entity = EXAMPLE;
  model: EXAMPLE = {
    // id: 23,
    // test: 'asdasd',
    // name: 'basename',
    // age: 444,
    // birthDate: new Date('04-02-1990'),
    // isAmazing: true,
    // otherData: 'othereot',
    // href: 'http://onet.pl',
    // testjson: {
    //   isAwesome: false,
    //   age: 200,
    //   name: 'testing'
    // },
    // fromRaw: undefined as any
  } as any;

  fields = [
    {
      key: 'href',
      templateOptions: {
        required: true
      },
    },
    {
      key: 'selectwrappertest',
      type: 'selectwrapper',
      templateOptions: {
        placeholder: 'Choose love',
        label: 'Amazing Select',
        required: false
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
