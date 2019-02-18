import { Component, OnInit, Input } from '@angular/core';

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

  @Input() public model: PROCESS;

  messages: PROGRESS_DATA[] = []

  constructor() { }

  ngOnInit() {
    this.messages = this.model.allProgressData;
    log.i('messages', this.messages)
  }

}
