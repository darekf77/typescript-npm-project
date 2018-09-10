import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, TemplateRef, AfterContentInit } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs/Subscription';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';

@Component({
  selector: 'app-log-prcess',
  templateUrl: './log-prcess.component.html',
  styleUrls: ['./log-prcess.component.scss']
})
export class LogPrcessComponent implements OnInit, OnDestroy, AfterContentInit {

  @Input() type: 'build' | 'serve';
  @ViewChild('dialogTmpl') dialogTmpl: TemplateRef<any>;
  isRealtime = false;
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
    await this.getLastNlinesOfLog(10)
    if (this.isRealtime) {
      setTimeout(() => {
        this.pullLastLoop()
      }, 1000)
    }
  }

  async getWholeLog() {
    const data = await this.buildController.getByIdLog(this.build.id, this.type).received
    this.content = data.body.json.join('<br>')
  }

  async getLastNlinesOfLog(n: number) {
    const data = await this.buildController.getByIdLog(this.build.id, this.type, n).received
    this.content = data.body.json.join('<br>')
  }

  async refresh() {
    await this.getWholeLog();
  }

  @Output() hide = new EventEmitter<boolean>();


  handlers: Subscription[] = [];
  ngOnInit() {

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
