import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser/controllers/ExamplesController';
import * as _ from 'lodash';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { getFormlyFrom } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
import { EXAMPLE } from 'ss-common-logic/browser/entities/EXAMPLE';

const log = Log.create('preview-multimedia-wrapper');

@Component({
  selector: 'app-preview-multimedia-wrapper',
  templateUrl: './preview-multimedia-wrapper.component.html',
  styleUrls: ['./preview-multimedia-wrapper.component.scss']
})
export class PreviewMultimediaWrapperComponent {

  form = new FormGroup({});
  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      key: 'Input',
      type: 'multimediawrapper',
      templateOptions: {
        label: 'Input',
        placeholder: 'Placeholder',
        description: 'Description',
        required: true,
      },
    },
  ];

}
