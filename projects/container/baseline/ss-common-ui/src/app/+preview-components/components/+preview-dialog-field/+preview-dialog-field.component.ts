import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-preview-dialog-field',
  templateUrl: './preview-dialog-field.component.html',
  styleUrls: ['./preview-dialog-field.component.scss']
})
export class PreviewDialogFieldComponent implements OnInit {

  constructor() {

  }

  form = new FormGroup({});

  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[];


  ngOnInit() {

    this.fields = [];
    // this.fields = [
    //   {
    //     key: 'selectwrappertest',
    //     type: 'selectwrapper',
    //     templateOptions: {
    //       required: true,
    //       label: 'Amazing Select',
    //       crud: this.exampleService
    //     }
    //   }
    // ];
  }

}
