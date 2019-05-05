import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/apps/example/ExamplesController';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-preview-editor-wrapper',
  templateUrl: './+preview-editor-wrapper.component.html',
  styleUrls: ['./+preview-editor-wrapper.component.scss']
})
export class PreviewEditorWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController) {

  }

  form = new FormGroup({});

  model: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[];


  ngOnInit() {


    this.fields = [
      // {
      //   key: 'editorwrappertest',
      //   type: 'editorwrapperformly',
      //   templateOptions: {
      //     required: true,
      //     label: 'Amazing Editor',
      //     crud: this.exampleService
      //   }
      // }
    ];
  }

}
