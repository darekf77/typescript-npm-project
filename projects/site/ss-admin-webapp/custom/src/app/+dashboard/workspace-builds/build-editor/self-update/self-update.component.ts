import { Component, OnInit, Input } from '@angular/core';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';

import { Log, Level } from 'ng2-logger/browser';
import { PROGRESS_BAR_DATA } from 'tnp-bundle/browser';
const log = Log.create('self build components')


@Component({
  selector: 'app-self-update',
  templateUrl: './self-update.component.html',
  styleUrls: ['./self-update.component.scss']
})
export class SelfUpdateComponent implements OnInit {

  get inProgress() {
    return (this.progress && this.progress.status === 'inprogress')
  }

  progress: PROGRESS_BAR_DATA;
  operation: string;
  operationErros: string[] = [];


  @Input() model: BUILD;

  autorebuild(project: TNP_PROJECT) {
    log.i('self build ', project)
  }

  constructor() { }

  ngOnInit() {
  }

}
