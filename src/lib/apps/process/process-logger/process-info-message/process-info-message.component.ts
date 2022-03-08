//#region imports
import { _ } from 'tnp-core';
import {
  Component, OnInit, Input, ElementRef,
  OnDestroy, AfterViewInit, HostBinding
} from '@angular/core';
import { PROCESS } from '../../PROCESS';
import 'rxjs/add/observable/fromEvent';
import { BehaviorSubject } from 'rxjs';
import { ProcessLoggerBaseClass } from '../../process-logger-base.class';
//#endregion

@Component({
  selector: 'app-process-info-message',
  templateUrl: './process-info-message.component.html',
  styleUrls: ['process-info-message.component.scss'],
})
export class ProcessInfoMessageComponent extends ProcessLoggerBaseClass implements OnInit, OnDestroy {

  get process() {
    return this.model;
  }

  get lsKey() {
    return `process-info-message-model-height-${this.model.id}`;
  }
  // @ts-ignore
  @Input() public model: PROCESS;
  @Input() public changes: BehaviorSubject<void>;
  messPrev: number;
  messages = [];

  ngOnInit() {

    this.handlers.push(this.changes.subscribe(() => {
      // console.log('CHANGES PROCESS INFO')
      this.messages = this.model.allProgressData;
      this.scrollDown();
      this.removeDuplicates();
    }) as any);


    // console.log(`SUBSCRIBE PROPTERY: ${this.process.id} - allProgressData `);

    // this.process.subscribeRealtimeUpdates({
    //   property: 'allProgressData',
    //   bufforProperty: '_allProgressData',
    //   callback: () => {
    //     this.changes.next(void 0);
    //   }
    // });


  }

  removeDuplicates() {
    // if (this.process && this.process._allProgressData) {
    //   const unique = {};
    //   this.process._allProgressData.forEach(c => {
    //     unique[_.snakeCase(c.date as any)] = c;
    //   });
    //   this.process._allProgressData = Object
    //     .keys(unique)
    //     .map(k => unique[k]);
    // }
  }


  ngOnDestroy(): void {
    // this.handlers.forEach(h => h.unsubscribe());
    // this.resizeService.removeResizeEventListener(this.elemetRef.nativeElement);
    // if (this.model instanceof PROCESS) {
    //   this.process.unsubscribeRealtimeUpdates('allProgressData');
    // }
  }

}
