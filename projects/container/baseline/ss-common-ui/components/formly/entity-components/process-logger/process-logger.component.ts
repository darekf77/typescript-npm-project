import { Morphi } from 'morphi/browser';
import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';

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

  public static ids = 0;
  @Input() public model: PROCESS;
  private num: number;
  isOpen = false;
  inited = false;
  get process() {
    return this.model;
  }

  async action() {
    if (this.process.state === 'running') {
      await this.process.stop();
    } else {
      await this.process.start();
    }
  }

  isNumber(v) {
    return _.isNumber(v);
  }


  get title() {
    return this.process && this.process.name;
  }

  get icon() {
    if (!this.process) {
      return;
    }
    if (this.process.state === 'notStarted') {
      return 'play_arrow';
    }
    if (this.process.state === 'running') {
      return 'stop';
    }
    return 'replay';
  }

  get label() {
    if (!this.process || this.process.state === 'notStarted') {
      return 'start';
    }
    if (this.process.state === 'running') {
      return 'stop';
    }
    return 'restart';
  }

  reset() {
    this.isOpen = false;
    setTimeout(() => {
      this.num = ProcessLoggerComponent.ids++;
      this.isOpen = true;
    });
  }

  onClose() {
    this.isOpen = false;
  }

  constructor() {
    super();
    this.num = ProcessLoggerComponent.ids++;
  }


  ngOnInit() {
    this.inited = true;
    // log.i('this.formControl.value', this.formControl.value);
  }

  onChange(v) {
    this.formControl.setValue(v);
    console.log(this.model);
  }


}
