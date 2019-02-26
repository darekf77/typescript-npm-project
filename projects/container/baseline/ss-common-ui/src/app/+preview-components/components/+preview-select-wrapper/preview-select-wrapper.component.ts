import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/ExamplesController';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-preview-select-wrapper',
  templateUrl: './preview-select-wrapper.component.html',
  styleUrls: ['./preview-select-wrapper.component.scss']
})
export class PreviewSelectWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController) {

  }

  form = new FormGroup({});

  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[];


  ngOnInit() {


    this.fields = [
      {
        key: 'selectwrappertest',
        type: 'selectwrapper',
        templateOptions: {
          required: true,
          label: 'Amazing Select',
          crud: this.exampleService
        }
      }
    ];
  }

}
