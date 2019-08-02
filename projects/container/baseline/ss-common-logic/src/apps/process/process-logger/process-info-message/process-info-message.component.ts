import * as _ from 'lodash';
import {
  Component, OnInit, Input, ElementRef,
  OnDestroy, AfterViewInit, HostBinding
} from '@angular/core';

import { Log } from 'ng2-logger';

import { PROCESS } from '../../PROCESS';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import {
  BaseComponent, ResizeService
} from 'ss-helpers/components';



@Component({
  selector: 'app-process-info-message',
  templateUrl: './process-info-message.component.html',
  styleUrls: ['process-info-message.component.scss'],
})
export class ProcessInfoMessageComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewInit {

  get process() {
    return this.model;
  }

  constructor(private elemetRef: ElementRef, public resizeService: ResizeService) {
    super();

  }


  get lsKey() {
    return `process-info-message-model-height-${this.model.id}`;
  }

  @Input() public model: PROCESS;

  @Input() public changes: BehaviorSubject<void>;

  messPrev: number;
  messages = [];

  @HostBinding('style.height.px') height = 190;

  scrollDown() {
    setTimeout(() => {
      if (this.elemetRef && this.elemetRef.nativeElement) {
        this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
      }
    }, 100);
  }

  ngAfterViewInit() {
    this.messages = this.model.allProgressData;
    // const savedHeight = Number(localStorage.getItem(this.lsKey));
    // // console.log('from local storage height', savedHeight)
    // setTimeout(() => {
    //   if (!isNaN(savedHeight) && savedHeight > 0) {
    //     this.height = savedHeight;
    //   }
    //   this.scrollDown();
    // });
  }

  ngOnInit() {

    this.resizeService.addResizeEventListener(this.elemetRef.nativeElement, () => {
      const height = Number((this.elemetRef.nativeElement as HTMLElement).style.height.replace('px', ''));
      // console.log('set new height',height)
      localStorage.setItem(this.lsKey, height.toString());
    });

    this.handlers.push(this.changes.subscribe(() => {
      // console.log('CHANGES PROCESS INFO')
      this.messages = this.model.allProgressData;
      this.scrollDown();
      this.removeDuplicates();
    }) as any);


    // console.log(`SUBSCRIBE PROPTERY: ${this.process.id} - allProgressData `);

    this.process.subscribeRealtimeUpdates({
      property: 'allProgressData',
      bufforProperty: '_allProgressData',
      callback: () => {
        this.changes.next(void 0);
      }
    });




  }

  removeDuplicates() {
    if (this.process && this.process._allProgressData) {
      const unique = {};
      this.process._allProgressData.forEach(c => {
        unique[_.snakeCase(c.date as any)] = c;
      });
      this.process._allProgressData = Object
        .keys(unique)
        .map(k => unique[k]);
    }
  }


  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
    this.resizeService.removeResizeEventListener(this.elemetRef.nativeElement);
    if (this.model instanceof PROCESS) {
      this.process.unsubscribeRealtimeUpdates('allProgressData');
    }
  }

}
