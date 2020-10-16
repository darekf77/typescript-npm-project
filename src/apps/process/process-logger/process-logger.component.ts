//#region imports
import { Morphi, ModelDataConfig, MDC } from 'morphi';
import {
  Component, OnInit, Input, ViewChild, ElementRef,
  OnDestroy, OnChanges, SimpleChange, AfterViewInit
} from '@angular/core';
import * as _ from 'lodash';

// formly
import { PROCESS } from '../PROCESS';
import {
  BaseFormlyComponent, DualComponentController
} from 'tnp-helpers';
// logger
import { Log, Level } from 'ng2-logger';
import { BehaviorSubject } from 'rxjs';
import { DraggablePopupComponent } from 'tnp-ui';
import { LocalStorage } from 'ngx-store';
//#endregion

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
export class ProcessLoggerComponent extends BaseFormlyComponent implements OnInit, OnDestroy, AfterViewInit {

  DualComponentController = DualComponentControllerExtended;

  changes = new BehaviorSubject(void 0);
  actionClicked = false;
  @Input() public config: ModelDataConfig;
  @Input() size: 'compact' | 'normal' = 'normal';
  @ViewChild(DraggablePopupComponent) popup: DraggablePopupComponent;
  @LocalStorage() expandedById: {
    [key: string]: boolean;
  } & { save: () => void; };

  @LocalStorage() openOnStartById: {
    [key: string]: boolean;
  } & { save: () => void; };

  //#region getters
  public isOpen = false;
  get isOpenOnStart() {
    if (_.isNil(this.id)) {
      return;
    }
    return this.openOnStartById[this.id];
  }
  set isOpenOnStart(v) {
    if (_.isNil(this.id)) {
      return;
    }
    this.openOnStartById = this.openOnStartById;
    this.openOnStartById[this.id] = v;
    this.openOnStartById.save();
  }


  get isExpanded() {
    return this.expandedById[this.id];
  }
  set isExpanded(v) {
    if (this.id) {
      this.expandedById = this.expandedById;
      this.expandedById[this.id] = v;
      this.expandedById.save();
    }
  }

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

  get id() {
    return !!this.process ? `process${this.process && this.process.id}` : void 0;
  }

  //#endregion

  constructor() {
    super();
  }

  //#region angular hooks
  ngOnInit() {
    super.ngOnInit();
    if (_.isNil(this.expandedById[this.id])) {
      this.isExpanded = true;
    }
    if (_.isNil(this.openOnStartById[this.id])) {
      this.isOpenOnStart = false;
    }
    this.subscribe();
    if (this.isOpenOnStart) {
      this.isOpen = true;
    }
  }

  ngAfterViewInit() {

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
  //#endregion

  onPin(v: boolean) {
    this.isOpenOnStart = v;
  }

  openOrClose() {
    this.isOpen = !this.isOpen;
  }

  public async action() {
    if (this.process.state === 'running') {
      await this.process.stop();
    } else {
      await this.process.start();
    }
    this.changes.next(void 0);
  }


  public reset() {
    this.isOpen = false;
    setTimeout(() => {
      this.isOpen = true;
    });
  }


  private subscribe() {
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


}
