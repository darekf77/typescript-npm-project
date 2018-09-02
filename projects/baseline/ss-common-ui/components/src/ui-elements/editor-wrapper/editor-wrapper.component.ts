import { Component, OnInit } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('editor wrapper');

export type OptionsButtons = 'bold' | 'italic' | 'underline';

@Component({
  selector: 'app-editor-wrapper',
  templateUrl: './editor-wrapper.component.html',
  styleUrls: ['./editor-wrapper.component.scss']
})
export class EditorWrapperComponent extends FieldType implements OnInit {

  // constructor() { }



  buttons = '';

  contentChange(e) {
    setTimeout(() => this.field.formControl.setValue(e));
  }

  ngOnInit() {
    const buttons: OptionsButtons[] = _.get(this, 'field.templateOptions.buttons', []);
    if (buttons.length === 0) {
      buttons.push('bold');
      buttons.push('italic');
      buttons.push('underline');
    }

    const res = buttons.toString();
    log.i('buttons', res);
    this.buttons = res;
  }

}
