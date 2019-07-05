import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';
import * as _ from 'lodash';
import { Morphi } from 'morphi';
import { Log, Level } from 'ng2-logger';
import { EXAMPLE } from 'ss-common-logic/src/apps/example/EXAMPLE';
import { Helpers } from 'morphi/helpers';

const log = Log.create('preview-form-wrapper');

@Component({
  selector: 'app-preview-form-wrapper',
  templateUrl: './preview-form-wrapper.component.html',
  styleUrls: ['./preview-form-wrapper.component.scss']
})
export class PreviewFormWrapperComponent implements OnInit {

  reload = false;
  entity = EXAMPLE;
  model: EXAMPLE = {} as any;
  include: string[];
  fields = [
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
  accessKeys = [];
  selectedValue: string;

  constructor(public exampleService: ExamplesController) {
    log.i('exampleService', exampleService);
    this.accessKeys = Helpers.Class.describeProperites(EXAMPLE)
      .map(p => {
        return { name: p, value: p };
      });
  }


  async ngOnInit() {
    const models = await this.exampleService.getAll().received;
    log.i('models', models);
    this.model = models.body.json[0];
    this.selectedValue = window.localStorage.getItem('selectedValue');
    this.changeValue();
  }


  changeValue() {
    log.i('selected', this.selectedValue);
    window.localStorage.setItem('selectedValue', this.selectedValue);
    if (!this.selectedValue || this.selectedValue === 'ALL') {
      this.include = void 0;
    } else {
      this.include = [this.selectedValue];
    }
    log.i('include', this.include);
    this.reloadForm();
  }

  reloadForm() {
    this.reload = true;
    setTimeout(() => {
      this.reload = false;
    });
  }

}
