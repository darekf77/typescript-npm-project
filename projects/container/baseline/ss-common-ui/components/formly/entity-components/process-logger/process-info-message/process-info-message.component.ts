import * as _ from 'lodash';
import {
  Component, OnInit, Input, ViewChild, ElementRef,
  EventEmitter, Output, OnDestroy, AfterViewInit
} from '@angular/core';

import { Log } from 'ng2-logger';
const log = Log.create('process infor meessages')

import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';
import { PROGRESS_DATA } from 'tnp-bundle/browser';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseComponent } from '../../../../helpers/base-component';



@Component({
  selector: 'app-process-info-message',
  templateUrl: './process-info-message.component.html',
  styleUrls: ['./process-info-message.component.scss']
})
export class ProcessInfoMessageComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() public model: PROCESS;
  @Input() public changes: BehaviorSubject<void>;

  messPrev: number;
  messages = [];

  constructor(private elemetRef: ElementRef) {
    super()
  }

  scrollDown() {
    setTimeout(() => {
      if (this.elemetRef && this.elemetRef.nativeElement) {
        this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
      }
    }, 100)
  }

  ngAfterViewInit() {
    this.messages = this.model.allProgressData;
    this.scrollDown()
  }

  handlers: Subscription[] = []

  ngOnInit() {

    this.handlers.push(this.changes.subscribe(() => {
      // console.log('CHANGES PROCESS INFO')
      this.messages = this.model.allProgressData;
      this.scrollDown()
    }))
  }


  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe())

  }

}
