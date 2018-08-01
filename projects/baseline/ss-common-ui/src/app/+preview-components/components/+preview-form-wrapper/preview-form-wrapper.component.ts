import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { getFromlyFrom } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
import { EXAMPLE } from 'ss-common-logic/browser/entities/EXAMPLE';

const log = Log.create('preview-form-wrapper');

@Component({
  selector: 'app-preview-form-wrapper',
  templateUrl: './preview-form-wrapper.component.html',
  styleUrls: ['./preview-form-wrapper.component.scss']
})
export class PreviewFormWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController) {

  }

  form = new FormGroup({});
  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      key: 'Input',
      type: 'input',
      templateOptions: {
        label: 'Input',
        placeholder: 'Placeholder',
        description: 'Description',
        required: true,
      },
    },
  ];

  ngOnInit() {
    const fields = getFromlyFrom(EXAMPLE);
    log.i('formly config from class example', fields);
    this.fields = fields;
    setTimeout(async () => {
      // await this.exampleService.info().received.observable.take(1).toPromise();
      await this.exampleService.info2().received.observable.take(1).toPromise();
    });
  }

}
