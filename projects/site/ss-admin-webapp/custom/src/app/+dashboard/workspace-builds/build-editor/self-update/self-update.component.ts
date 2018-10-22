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
    if (_.isString(child)) {
      log.i(`Self build of child "${child}" for project `, project)
      try {
        await this.projectController.selfupdateStart(child).received;
      } catch (e) {
        log.er(e)
      }
    } else {
      log.i('self build ', project)
      try {
        await this.projectController.selfupdateStart().received;
        log.i('Now try to get status')
        await this.updateStatus(true)
      } catch (e) {
        log.er(e)
      }
    }
  }

  async updateStatus(waitForAwser = false, once = false) {

    if (waitForAwser) {
      log.d('Wait for first update status')
    }

    this.operationInProgress = true;
    try {
      const data = await this.projectController.selfupdateStatus().received;
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



    if (!once) {
      if (!(this.progress && this.progress.status === 'complete')) {
        this.getUpdateAgain()
      }
    }

    if (once && this.progress && this.progress.status === 'inprogress') {
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
    // await this.updateStatus(false, true);
  }

}
