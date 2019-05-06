import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/ExamplesController';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-preview-select-wrapper',
  templateUrl: './preview-select-wrapper.component.html',
  styleUrls: ['./preview-select-wrapper.component.scss']
})
export class PreviewSelectWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController, private formBuilder: FormBuilder) {

  }

  model: any = {};
  model1: any = {};
  model2: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[];

  onSubmit(m) {
    console.log('submit is working !', m)
    console.log('this.model !', this.model)
  }

  field = {
    key: 'selectwrappertest',
    type: 'selectwrapper',
    templateOptions: {
      required: true,
      label: 'Amazing Select',
      crud: this.exampleService
    }
  }

  ngOnInit() {

    this.fields = [
      this.field
    ];
  }

}
