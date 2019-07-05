import { Component, OnInit } from '@angular/core';
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-preview-list-wrapper',
  templateUrl: './preview-list-wrapper.component.html',
  styleUrls: ['./preview-list-wrapper.component.scss']
})
export class PreviewListWrapperComponent implements OnInit {
  model: any = {};

  field = {
    key: 'listwrappertest',
    type: 'listwrapper',
    templateOptions: {
      required: true,
      data: [],
      label: 'Amazing Select',
    }
  }

  constructor(public exampleService: ExamplesController) {

  }

  data = [];
  fields: FormlyFieldConfig[];


  async ngOnInit() {

    // setTimeout(async () => {
    // await this.exampleService.info().received.observable.take(1).toPromise();
    const response = await this.exampleService.getAll().received;
    this.data = response.body.json.map(d => {
      return { name: d.href, href: `./amazing/:${d.id}/test'` };
    });
    console.log('this.data for COMPONENT', this.data);
    this.field.templateOptions.data = this.data;
    this.fields = [
      this.field
    ];
    console.log('LIST WRAPPER ON ININT', this.data);
  }

}
