import { Morphi, ModelDataConfig, MDC } from 'morphi';
import {
  Component, OnInit, Input, ViewChild, ElementRef,
  OnDestroy,
  OnChanges, SimpleChange
} from '@angular/core';
import * as _ from 'lodash';

// formly
import { PROCESS } from '../PROCESS';
import {
  BaseFormlyComponent, DualComponentController
} from 'ss-helpers/components';
// logger
import { Log, Level } from 'ng2-logger';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

const log = Log.create('process loger');

export class DualComponentControllerExtended extends DualComponentController {

  get modelDataConfig(): MDC {
    return this.getValTemplateOptions('modelDataConfig')
  }

}

@Morphi.Formly.RegisterComponentForEntity(PROCESS)
@Component({
  selector: 'app-process-logger',
  templateUrl: './process-logger.component.html',
  styleUrls: ['./process-logger.component.scss']
})
export class ProcessLoggerComponent extends BaseFormlyComponent implements OnInit, OnDestroy {

  DualComponentController = DualComponentControllerExtended;
  @Input() size: 'compact' | 'normal' = 'normal';

  isExpanded = false;
  get process() {
    return this.ctrl && this.ctrl.value;
  }


  get title() {
    return this.process && `${this.process.name} - process ID: ${this.process.id}`;
  }

  get color() {
    if (!this.process) {
      return;
    }
    if (this.process.progress && this.process.progress.value === 100
      || this.process.state === 'exitedWithSuccess') {
      return 'green';
    }
    if (this.process.progress && this.process.progress.value === 100) {
      return 'green';
    }
    if (this.process.state === 'running' ||
      this.process.state === 'inProgressOfStarting' ||
      this.process.state === 'inProgressOfStopping') {
      return 'blue';
    }
    if (this.process.state === 'exitedWithError') {
      return 'red';
    }
  }

  get icon() {
    if (!this.process) {
      return;
    }
    if (this.process.state === 'inProgressOfStarting' ||
      this.process.state === 'inProgressOfStopping') {
      return 'waiting';
    }
    if (this.process.state === 'notStarted') {
      return 'play_arrow';
    }
    if (this.process.state === 'running') {
      return 'stop';
    }
    return 'replay';
  }

  get state() {
    if (!this.process || this.process.state === 'notStarted') {
      return 'start';
    }
    if (this.process.state === 'running') {
      return 'stop';
    }
    return 'restart';
  }

  get nameForLC() {
    return this.process && `pinProcess${this.process.id}`;
  }

  get nameForExpand() {
    return this.process && `expandProcess${this.process.id}`;
  }

  constructor() {
    super();
  }

  get id() {
    return !!this.process && `process${this.process && this.process.id}`;
  }

  @Input() public config: ModelDataConfig;

  isOpen = false;

  changes = new BehaviorSubject(void 0);

  pinned = false;
  actionClicked = false;
  async action() {
    // log.i('some action')
    // if (this.actionClicked) {
    //   log.i('ommiting click')
    //   return
    // }
    // this.actionClicked = true;
    // setTimeout(() => {
    //   this.actionClicked = false;
    // }, 1000)
    if (this.process.state === 'running') {
      await this.process.stop();
    } else {
      await this.process.start();
    }
    this.changes.next(void 0);

  }

  get progress() {
    if (!this.process) {
      return '.... loading process'
    }
    return (this.process &&
      this.process.progress) ?
      ((!this.process.isSync &&
        _.isNumber(this.process.progress.value))
        ? (this.process.progress.value + '%') :
        this.process.progress.msg) :
      (this.process.state === 'inProgressOfStarting' ||
        this.process.state === 'inProgressOfStopping' ||
        this.process.state === 'running') ? '...loading' : '';
  }

  isNumber(v) {
    return _.isNumber(v);
  }

  reset() {
    this.isOpen = false;
    setTimeout(() => {
      this.isOpen = true;
    });
  }

  onClose() {
    this.isOpen = false;
    localStorage.removeItem(this.nameForLC);
  }

  onPin(value: boolean) {
    if (value) {
      localStorage.setItem(this.nameForLC, 'true');
    } else {
      localStorage.removeItem(this.nameForLC);
    }
  }

  onExpand(value: boolean) {
    if (value) {
      localStorage.setItem(this.nameForExpand, 'true');
    } else {
      localStorage.removeItem(this.nameForExpand);
    }
  }

  subscribe() {
    if (this.process && !this.process.isSync) {
      if (!(this.process instanceof PROCESS)) {
        console.error('[processLogger] Process in not instance of PROCESS')
        return
      }
      console.log(`SUBSCRIBE ENTITY: ${this.process.id}`);
      this.process.subscribeRealtimeUpdates({
        modelDataConfig: this.config as any,
        callback: () => {
          this.changes.next(void 0);
        }
      });

    }
  }

  ngOnInit() {
    super.ngOnInit()
    log.i('ON INIT PROCESS');
    this.isExpanded = _.isString(localStorage.getItem(this.nameForExpand));
    this.pinned = _.isString(localStorage.getItem(this.nameForLC));
    this.isOpen = this.pinned;
    console.log(`should be piinned ${this.process && this.process.id}`, this.pinned);
    // log.i('this.formControl.value', this.formControl.value);
    this.subscribe();
  }

  ngOnDestroy() {
    if (this.model instanceof PROCESS) {
      this.model.unsubscribeRealtimeUpdates();
    }

  }
  onChange(v) {
    this.formControl.setValue(v);
    console.log(this.model);
  }


}
