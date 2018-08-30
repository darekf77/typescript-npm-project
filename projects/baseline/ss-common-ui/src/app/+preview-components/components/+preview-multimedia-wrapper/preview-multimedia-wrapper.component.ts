import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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

  _mode = 'edit';

  get mode() {
    return this._mode;
  }

  set mode(v) {
    this._mode = v;
    this.fields.forEach(f => {
      f.templateOptions.mode = this.mode;
    });
  }

  form = new FormGroup({});
  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      key: 'amazingPicture',
      type: 'multimediawrapper',
      templateOptions: {
        openDialog: true,
        label: 'Input',
        placeholder: 'Placeholder',
        description: 'Description',
        required: true,
      },
    },
    {
      key: 'amazingPicture2',
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
