import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-preview-editor-wrapper',
  templateUrl: './+preview-editor-wrapper.component.html',
  styleUrls: ['./+preview-editor-wrapper.component.scss']
})
export class PreviewEditorWrapperComponent implements OnInit {

  constructor(public exampleService: ExamplesController) {

  }

  model1: any = {};
  model2: any = {};
  field = {
    key: 'editorwrappertest',
    type: 'texteditor',
    templateOptions: {
      required: true,
      label: 'Amazing Editor',
      crud: this.exampleService
    }
  }

  buttons: any[] = ['bold']

  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[];


  ngOnInit() {


    this.fields = [
      this.field
    ];
  }

}
