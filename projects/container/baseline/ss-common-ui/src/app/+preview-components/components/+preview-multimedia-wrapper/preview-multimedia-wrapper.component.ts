import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';

import * as _ from 'lodash';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { Log, Level } from 'ng2-logger/browser';


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

  field = {
    key: 'amazingPicture',
    type: 'multimediawrapper',
    templateOptions: {
      // openDialog: true,
      label: 'Input',
      placeholder: 'Placeholder',
      description: 'Description',
      required: true,
    },
  }

  form = new FormGroup({});
  model1: any = {};
  model2: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    this.field
  ];


}
