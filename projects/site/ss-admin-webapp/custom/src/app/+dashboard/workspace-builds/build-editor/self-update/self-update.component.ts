import * as _ from 'lodash';

import { Component, OnInit, Input } from '@angular/core';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';

import { Log, Level } from 'ng2-logger/browser';
import { PROGRESS_BAR_DATA } from 'tnp-bundle/browser';
import { TnpProjectController } from 'ss-common-logic/browser/controllers/TnpProjectController';
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

  operationInProgress: boolean = false;
  progress: PROGRESS_BAR_DATA;
  operation: string;
  child: string;
  operationErros: string[] = [];

  get project(): TNP_PROJECT {
    return this.model && this.model.project;
  }


  @Input() model: BUILD;

  async autoUpdate(project: TNP_PROJECT, child?: string) {

    const childNameOK = _.isString(child);
    if (childNameOK) {
      log.i(`Self build of child "${child}" for project `, project)
    } else {
      log.i('Self build project', project)
    }

    try {
      await this.projectController.selfupdateStart(childNameOK ? child : undefined).received;
      log.i('Now try to get status')
      await this.updateStatus(true)
    } catch (e) {
      log.er(e)
    }

  }

  countDownMax = 5000;
  countDown = this.countDownMax;
  reloadCountDown() {
    if (this.countDown <= 0) {
      window.location.reload();
      return;
    }

    this.countDown -= 100;
    setTimeout(() => {
      this.reloadCountDown();
    }, 100)
  }

  async updateStatus(waitForAwser = false, firstCheck = false) {

    if (waitForAwser) {
      log.d('Wait for first update status')
    }

    this.operationInProgress = true;
    try {
      const data = await this.projectController.selfupdateStatus(waitForAwser).received;
      let { child, operation, operationErrors, progress } = data.body.json;
      this.child = child;
      this.operation = operation;
      this.operationErros = operationErrors;
      progress = _.merge(new PROGRESS_BAR_DATA(), progress);
      log.d('new progress', progress)
      this.progress = progress;
      log.d('new data', data.body.json)
    } catch (error) {
      log.er(error)
    }
    this.operationInProgress = false;

    if (this.progress && this.progress.status === 'complete') {
      if (!firstCheck) {
        this.reloadCountDown();
      }
    } else {
      this.getUpdateAgain()
    }

  }

  getUpdateAgain() {
    setTimeout(async () => {
      await this.updateStatus()
    }, 1000)
  }

  constructor(
    public projectController: TnpProjectController

  ) { }

  async ngOnInit() {
    this.operationInProgress = true;
    try {
      await this.updateStatus(false, true);
    } catch (error) {

    }
    this.operationInProgress = false;
  }

}
