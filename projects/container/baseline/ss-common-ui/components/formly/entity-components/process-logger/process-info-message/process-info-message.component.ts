import { Component, OnInit, Input, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';

import { Log } from 'ng2-logger';
const log = Log.create('process infor meessages')

import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';
import { PROGRESS_DATA } from 'tnp-bundle/browser';



@Component({
  selector: 'app-process-info-message',
  templateUrl: './process-info-message.component.html',
  styleUrls: ['./process-info-message.component.scss']
})
export class ProcessInfoMessageComponent implements OnInit {
  @Output() public changes = new EventEmitter()

  @Input() public model: PROCESS;

  messPrev: number;
  get messages() {
    let res = this.model ? this.model.allProgressData : []
    if (res.length > 0 && _.isUndefined(this.messPrev)) {
      this.messPrev = res.length;
      this.changes.next()
    }
    if (this.messPrev !== res.length) {
      this.changes.next()
    }
    return res;
  }

  constructor() { }

  ngOnInit() {
    log.i('messages', this.messages)
  }

}
