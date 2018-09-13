import { Component, OnInit, Input, Output, EventEmitter, NgZone } from '@angular/core';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// third part
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('building process')
import { Global } from 'morphi/browser'
// local
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { MatDialog } from '@angular/material';
import { LogPrcessComponent } from '../log-prcess/log-prcess.component';
import { ProgressBarData } from 'ss-common-logic/browser/entities/PROGRESS_BAR';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { ProviderData } from '@angular/core/src/view';

@Component({
  selector: 'app-building-process',
  templateUrl: './building-process.component.html',
  styleUrls: ['./building-process.component.scss']
})
export class BuildingProcessComponent implements OnInit {




  fields = [


    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'play_arrow',
        // label: 'Start',
        action: async () => {
          await this.buildController.startBuildById(this.model.id).received
          this.refreshModel.next()
          log.i('build process started!')
        }
      },
      hideExpression: () => (!this.model || _.isNumber(this.model.pidBuildProces))
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'stop',
        action: async () => {
          await this.buildController.stopBuildById(this.model.id).received
          this.refreshModel.next()
          log.i('build process stopped!')
        }
      },
      hideExpression: () => (!this.model || !this.model.pidBuildProces)
    },
    {

      type: 'iconbutton',
      templateOptions: {
        icon: 'dvr',
        label: 'Logs',
        action: () => {
          this.isShowingBuildLogs = true;
        }
      }
    },
    {
      type: 'iconbutton',
      templateOptions: {
        icon: 'refresh',
        action: async () => {
          this.buildController.clearById(this.model.id).received.observable.subscribe(async () => {
            this.refreshModel.emit()
            log.i('CLEAR COMPLETE')
          })
          this.refreshModel.emit()
        }
      },
      expressionProperties: {
        'templateOptions.disabled': () => {
          return (this.model && !!this.model.pidClearProces)
        },
        'templateOptions.label': () => {
          return (this.model && !!this.model.pidClearProces) ? 'is clearing... ' : 'Clear';
        }
      },
    }
  ] as FormlyFieldConfig[];


  isShowingBuildLogs = false;

  @Input() model: BUILD;
  progress = new ProgressBarData();

  get info() {
    if (this.progress) {
      if (this.progress.status === 'error') {
        return `<strong style="color:red" >${this.progress.info}</strong>`
      } else if (this.progress.status === 'complete') {
        return `<strong style="color:green" >${this.progress.info}</strong>`
      } else if (this.progress.status === 'inprogress') {
        return `<span >${this.progress.info}</span>`
      }
    }
    return `
      <span style="color:lightgreen;opacity:0.7;"   >  -- process not stated -- </span>
    `
  }

  @Output() refreshModel = new EventEmitter();

  constructor(
    public buildController: BuildController,
    public matDialog: MatDialog,
    private ngZone: NgZone

  ) { }

  ngOnInit() {


    let s = new Subject();

    s.asObservable().subscribe((data) => {
      log.i('new progress', data);
      _.merge(this.progress, data);
      this.refreshModel.next()
    })

    Global.vars.socket.FE.on('newprogress', (data) => {
      this.ngZone.run(() => {
        s.next(data);
      })

    })

    this.getEndOfbuild().subscribe(data => {
      log.i('END OF BUILD - DATA FROM SOCKET', data)
      this.refreshModel.next()
    })

  }

  getEndOfbuild() {
    let observable = new Observable(observer => {

      Global.vars.socket.FE.on('endofbuild', (data) => {
        this.ngZone.run(() => {
          observer.next(data);
        })
      })

      return () => {
        log.i('something on disconnect')
      };
    })
    return observable;
  }



}
