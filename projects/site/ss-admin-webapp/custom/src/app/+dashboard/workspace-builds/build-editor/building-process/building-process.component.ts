import { Component, OnInit, Input, Output, EventEmitter, NgZone, AfterViewInit } from '@angular/core';
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
import { PROGRESS_BAR_DATA } from 'ss-common-logic/browser/entities/PROGRESS_BAR_DATA';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { ProviderData } from '@angular/core/src/view';

@Component({
  selector: 'app-building-process',
  templateUrl: './building-process.component.html',
  styleUrls: ['./building-process.component.scss']
})
export class BuildingProcessComponent implements OnInit, AfterViewInit {




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
      hideExpression: () => (!this.model || _.isNumber(this.model.pidBuildProces) || !!this.model.pidClearProces)
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
      hideExpression: () => (!this.model || !this.model.pidBuildProces || !!this.model.pidClearProces)
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
      hideExpression: () => (this.model && !!this.model.pidBuildProces)
    }
  ] as FormlyFieldConfig[];


  isShowingBuildLogs = false;

  @Input() model: BUILD;
  progress = new PROGRESS_BAR_DATA();

  get info() {
    if (this.progress) {
      if (this.progress.status === 'error') {
        return `<strong class="color-red" >${this.progress.info}</strong>`
      } else if (this.progress.status === 'complete') {
        return `<strong class="color-green" >${this.progress.info}</strong>`
      } else if (this.progress.status === 'inprogress') {
        return `<span class="color-blue" >${this.progress.info}</span>`
      }
    }
    return `
      <span class="color-muted"   >  -- process not stated -- </span>
    `
  }

  @Output() refreshModel = new EventEmitter();

  constructor(
    public buildController: BuildController,
    public matDialog: MatDialog,
    private ngZone: NgZone

  ) { }

  ngOnInit() {



    // let s = new Subject();

    // s.asObservable().subscribe((data) => {
    //   log.i('new progress', data);
    //   _.merge(this.progress, data);
    //   this.refreshModel.next()
    // })

    // Global.vars.socket.FE.on('newprogress', (data) => {
    //   this.ngZone.run(() => {
    //     s.next(data);
    //   })

    // })

    // this.getEndOfbuild().subscribe(data => {
    //   log.i('END OF BUILD - DATA FROM SOCKET', data)
    //   this.refreshModel.next()
    // })

    // this.getEndOfClear().subscribe((data) => {
    //   log.i('END OF CLEAR - DATA FROM SOCKET', data)
    //   this.refreshModel.next()
    // })

  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.progress = _.merge(new PROGRESS_BAR_DATA(), this.model && this.model.progress)
  }



}
