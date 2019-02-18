import * as _ from 'lodash';
import {
  Component, OnInit, Input, ViewChild, ElementRef,
  EventEmitter, Output, OnDestroy
} from '@angular/core';

import { Log } from 'ng2-logger';
const log = Log.create('process infor meessages')

import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';
import { PROGRESS_DATA } from 'tnp-bundle/browser';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';



@Component({
  selector: 'app-process-info-message',
  templateUrl: './process-info-message.component.html',
  styleUrls: ['./process-info-message.component.scss']
})
export class ProcessInfoMessageComponent implements OnInit, OnDestroy {

  @Input() public model: PROCESS;
  @Input() public changes: BehaviorSubject<void>;

  messPrev: number;
  get messages() {
    return this.model.allProgressData;
  }

  constructor(private elemetRef: ElementRef) {

  }

  handlers: Subscription[] = []

  ngOnInit() {

    this.changes.subscribe(() => {
      console.log('CHANGES HUHUHU')
      if (this.elemetRef && this.elemetRef.nativeElement) {
        this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
      }

    })

    this.changes.asObservable().subscribe(() => {
      console.log('KRUWAAAAAAAAAAA HUHUHU')
      if (this.elemetRef && this.elemetRef.nativeElement) {
        this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
      }

    })

    log.i('messages', this.messages)
  }


  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe())

  }

}
