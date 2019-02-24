import * as _ from 'lodash';
import {
  Component, OnInit, Input, ViewChild, ElementRef,
  EventEmitter, Output, OnDestroy, AfterViewInit, HostBinding, HostListener, NgZone, DoCheck
} from '@angular/core';

import { Log } from 'ng2-logger';
const log = Log.create('process infor meessages');

import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';
import { PROGRESS_DATA } from 'tnp-bundle/browser';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/fromEvent';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseComponent } from '../../../../helpers/base-component';
import { ResizeService } from '../../../../helpers/resize-service';



@Component({
  selector: 'app-process-info-message',
  templateUrl: './process-info-message.component.html',
  styleUrls: ['./process-info-message.component.scss'],
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

  @HostBinding('style.height.px') height = 300;

  handlers: Subscription[] = [];

  scrollDown() {
    setTimeout(() => {
      if (this.elemetRef && this.elemetRef.nativeElement) {
        this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
      }
    }, 100);
  }

  ngAfterViewInit() {
    this.messages = this.model.allProgressData;
    const savedHeight = Number(localStorage.getItem(this.lsKey));
    // console.log('from local storage height', savedHeight)
    setTimeout(() => {
      if (!isNaN(savedHeight)) {
        this.height = savedHeight;
      }
      this.scrollDown();
    });
  }

  ngOnInit() {

    this.resizeService.addResizeEventListener(this.elemetRef.nativeElement, (elem) => {
      const height = Number((this.elemetRef.nativeElement as HTMLElement).style.height.replace('px', ''));
      // console.log('set new height',height)
      localStorage.setItem(this.lsKey, height.toString());
    });

    this.handlers.push(this.changes.subscribe(() => {
      // console.log('CHANGES PROCESS INFO')
      this.messages = this.model.allProgressData;
      this.scrollDown();
    }));

    if (!this.process.isSync) {

      this.process.subscribeRealtimeUpdates({
        condition: () => this.process.updateCondition,
        property: 'allProgressData',
        bufforProperty: '_allProgressData'
      });

    }
  }


  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
    this.resizeService.removeResizeEventListener(this.elemetRef.nativeElement);
    if (this.model instanceof PROCESS) {
      this.process.unsubscribeRealtimeUpdates('_allProgressData');
    }
  }

}
