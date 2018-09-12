import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, TemplateRef, AfterContentInit } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs/Subscription';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { ProgressBarData } from 'ss-common-ui/module';
import * as _ from 'lodash';

import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('log progress')

@Component({
  selector: 'app-log-prcess',
  templateUrl: './log-prcess.component.html',
  styleUrls: ['./log-prcess.component.scss']
})
export class LogPrcessComponent implements OnInit, OnDestroy, AfterContentInit {

  @Input() type: 'build' | 'serve';
  @Output() progress = new EventEmitter<ProgressBarData>();
  @ViewChild('dialogTmpl') dialogTmpl: TemplateRef<any>;
  isRealtime = false;
  currentProgress: ProgressBarData;
  constructor(
    public buildController: BuildController,
    private matDialog: MatDialog
  ) {

  }
  dialog: MatDialogRef<any>;

  content: string;

  @Input() build: BUILD;

  change(e: MatSlideToggleChange) {
    this.isRealtime = e.checked;
    if (this.isRealtime) {
      this.pullLastLoop()
    } else {
      this.getWholeLog()
    }
  }

  async pullLastLoop() {
    await this.getLastNlinesOfLog(50)
    this.isRealtime = (!!this.build.pidBuildProces);
    if (this.isRealtime) {
      setTimeout(() => {
        this.pullLastLoop()
      }, 1000)
    }
  }

  async getWholeLog() {
    const data = await this.buildController.getByIdLog(this.build.id, this.type).received
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

    // try {
    //   const p = JSON.parse(progress);
    //   const res = _.merge(new ProgressBarData(), p);
    //   this.progress.emit(res);
    //   this.currentProgress = res
    //   log.i('new progress', res)
    // } catch (error) {
    //   log.er('error trying to parse json from progress')
    // }
  }

  async getLastNlinesOfLog(n: number) {
    const data = await this.buildController.getByIdLog(this.build.id, this.type, n).received
    this.clear(data.body.json)
    this.content = data.body.json.join('<br>')
  }


  @Output() hide = new EventEmitter<boolean>();


  handlers: Subscription[] = [];
  ngOnInit() {
    this.isRealtime = (!!this.build.pidBuildProces);
    if (this.isRealtime) {
      this.pullLastLoop();
    } else {
      this.getWholeLog()
    }
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.dialog = this.matDialog.open(this.dialogTmpl, {
        height: '400px'
      });
      this.handlers.push(this.dialog.afterClosed().subscribe(() => {
        this.isRealtime = false;
        this.hide.emit()
      }))
      this.getWholeLog()
    })
  }

  ngOnDestroy(): void {
    this.isRealtime = false;
    this.dialog.close()
    this.handlers.forEach(h => h.unsubscribe())
  }

}
