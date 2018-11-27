import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-preview-formly-inputs',
  templateUrl: './preview-formly-inputs.component.html',
  styleUrls: ['./preview-formly-inputs.component.scss']
})
export class PreviewFormlyInputsComponent implements OnInit {

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
    setTimeout(async () => {
      // await this.exampleService.info().received.observable.take(1).toPromise();
      await this.exampleService.info2().received.observable.take(1).toPromise();
    });
  }

}
