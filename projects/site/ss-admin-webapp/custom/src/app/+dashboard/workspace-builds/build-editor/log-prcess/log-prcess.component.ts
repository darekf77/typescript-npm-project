import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, TemplateRef, AfterContentInit } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { TnpProjectController } from 'ss-common-logic/browser/controllers/TnpProjectController';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs/Subscription';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';

import * as _ from 'lodash';

import { Log, Level } from 'ng2-logger/browser';
import { PROGRESS_BAR_DATA } from 'ss-common-logic/browser/entities/PROGRESS_BAR_DATA';
const log = Log.create('log progress')

@Component({
  selector: 'app-log-prcess',
  templateUrl: './log-prcess.component.html',
  styleUrls: ['./log-prcess.component.scss']
})
export class LogPrcessComponent implements OnInit, OnDestroy, AfterContentInit {

  @Input() type: 'build' | 'serve';
  @Output() progress = new EventEmitter<PROGRESS_BAR_DATA>();
  @ViewChild('dialogTmpl') dialogTmpl: TemplateRef<any>;
  isRealtime = false;
  currentProgress: PROGRESS_BAR_DATA;
  constructor(
    public projectController: TnpProjectController,
    private matDialog: MatDialog
  ) {

  }
  dialog: MatDialogRef<any>;

  content: string;

  @Input() model: BUILD;

  change(e: MatSlideToggleChange) {
    this.isRealtime = e.checked;
    // if (this.isRealtime) {
    //   this.pullLastLoop()
    // } else {
    this.getWholeLog()
    // }
  }

  // async pullLastLoop() {
  //   await this.getLastNlinesOfLog(50)
  //   this.isRealtime = (!!this.build.project.pidBuildProces);
  //   if (this.isRealtime) {
  //     setTimeout(() => {
  //       this.pullLastLoop()
  //     }, 1000)
  //   }
  // }

  async getWholeLog() {
    const data = await this.projectController.getByIdLog(this.model.project.id, this.type).received
    this.clear(data.body.json)
    this.content = data.body.json.join('<br>')
  }

  private clear(logs: string[]) {
    // let progress = '';
    logs.forEach((l, i) => {
      if (/\[\[\[.*\]\]\]/g.test(l.trim())) {
        l = l.replace(/^\[\[\[/g, '').replace(/\]\]\]$/g, '');
        // progress = l;
        logs[i] = '';
      }
    })

  }

  async getLastNlinesOfLog(n: number) {
    const data = await this.projectController.getByIdLog(this.model.id, this.type, n).received
    this.clear(data.body.json)
    this.content = data.body.json.join('<br>')
  }


  @Output() hide = new EventEmitter<boolean>();


  handlers: Subscription[] = [];
  ngOnInit() {
    this.isRealtime = (!!this.model.project.pidBuildProces);
    // if (this.isRealtime) {
    //   this.pullLastLoop();
    // } else {
    this.getWholeLog()
    // }
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.dialog = this.matDialog.open(this.dialogTmpl, {
        height: '400px'
      });
      // this.dialog.afterClosed().subscribe(() => {
      //   this.isRealtime = false;
      //   this.hide.emit()
      // })
      this.getWholeLog()
    })
  }

  ngOnDestroy(): void {
    this.isRealtime = false;
    this.dialog.close()
    this.handlers.forEach(h => h.unsubscribe())
  }

}
