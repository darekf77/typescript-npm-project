import { Morphi } from 'morphi/browser';
import { Component, OnInit } from '@angular/core';

// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities';
// logger
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('process loger');

@Morphi.Formly.RegisterComponentForEntity(PROCESS)
@Component({
  selector: 'app-process-logger',
  templateUrl: './process-logger.component.html',
  styleUrls: ['./process-logger.component.scss']
})
export class ProcessLoggerComponent extends FieldType implements OnInit {

  vv = 122;
  constructor() {
    super();
  }

  ngOnInit() {
    log.i('this.formControl.value', this.formControl.value);
    this.vv = this.formControl.value;
  }

  onChange(v) {
    this.formControl.setValue(v);
    console.log(this.model);
  }


}
