import { Morphi, ModelDataConfig } from 'morphi/browser';
import {
  Component, OnInit, Input, ViewChild, ElementRef,
  OnDestroy,
  OnChanges, SimpleChange
} from '@angular/core';
import * as _ from 'lodash';

// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities';
// logger
import { Log, Level } from 'ng2-logger/browser';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { PROCESS_STATE } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';
import { PROGRESS_DATA } from 'tnp-bundle/browser';

const log = Log.create('process loger');

@Morphi.Formly.RegisterComponentForEntity(PROCESS)
@Component({
  selector: 'app-process-logger',
  templateUrl: './process-logger.component.html',
  styleUrls: ['./process-logger.component.scss']
})
export class ProcessLoggerComponent extends FieldType implements OnInit, OnDestroy {

  @Input() public model: PROCESS;

  isOpen = false;
  get process() {
    return this.model;
  }

  changes = new BehaviorSubject(void 0);
  async action() {
    if (this.process.state === 'running') {
      await this.process.stop();
    } else {
      await this.process.start();
      this.subscribe()
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
      this.isOpen = true;
    });
  }

  onClose() {
    this.isOpen = false;
    localStorage.removeItem(this.nameForLC)
  }

  get nameForLC() {
    return `pinProcess${this.process.id}`;
  }

  onPin(value: boolean) {
    if (value) {
      localStorage.setItem(this.nameForLC, 'true')
    } else {
      localStorage.removeItem(this.nameForLC)
    }
  }

  constructor() {
    super();
  }

  get id() {
    return !!this.process && `process${this.process && this.process.id}`
  }

  pinned = false;

  updateCondition(proc: PROCESS) {
    return (['running', 'inProgressOfStarting', 'inProgressOfStopping'] as PROCESS_STATE[])
      .includes(proc.state)
  }

  subscribe() {
    if (!this.process.isSync) {

      const condition = (proc) => this.updateCondition(proc);

      this.process.subscribeRealtimeUpdates({
        condition,
        callback: () => {
          this.changes.next(void 0)
        }
      })

      this.process.subscribeRealtimeUpdates<PROGRESS_DATA[]>({
        condition,
        property: 'allProgressData',
        update: () => {
          return this.model.ctrl.progressMessages(this.process.id, this.process.allProgressData.length).received
        }
      })
    }
  }

  ngOnInit() {
    log.i("ON INIT PROCESS")
    this.pinned = _.isString(localStorage.getItem(this.nameForLC));
    this.isOpen = this.pinned;
    console.log(`should be piinned ${this.process && this.process.id}`, this.pinned)
    // log.i('this.formControl.value', this.formControl.value);
    this.subscribe()
  }

  ngOnDestroy() {
    this.model.unsubscribeRealtimeUpdates()
  }
  onChange(v) {
    this.formControl.setValue(v);
    console.log(this.model);
  }


}
