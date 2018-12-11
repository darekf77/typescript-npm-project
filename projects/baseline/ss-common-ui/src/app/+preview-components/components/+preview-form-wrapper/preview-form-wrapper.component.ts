import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';
import * as _ from 'lodash';
import { Morphi } from 'morphi/browser';
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
    // {
    //   key: 'href',
    //   templateOptions: {
    //     required: true
    //   },
    // },
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
    log.i('exampleService', exampleService);
  }


  async ngOnInit() {
    const models =  await this.exampleService.getAll().received;
    log.i('models', models);
    this.model = models.body.json[0];
  }

}
