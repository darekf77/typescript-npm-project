import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
    },
    {
      type: 'infoprogressbar',
      templateOptions: {
        label: " Build progress"
      }
    }

  ] as FormlyFieldConfig[];


  textBuildLogs = ''
  isShowingBuildLogs = false;

  @Input() model: BUILD;
  @Output() refreshModel = new EventEmitter();

  constructor(
    public buildController: BuildController,
    public matDialog: MatDialog

  ) { }

  ngOnInit() {
    Global.vars.socket.FE.on('endofbuild', (data) => {
      log.i('DATA FROM SOCKET', data)
      this.refreshModel.next()
    })

    Global.vars.socket.FE.on('newprogress', (data) => {
      log.i('new progress', data);
      const prog = this.fields.find(({ type }) => type === 'infoprogressbar');
      if (prog) {
        if (!prog.templateOptions['value']) {
          prog.templateOptions['value'] = new ProgressBarData()
        }
        _.merge((prog.templateOptions['value'] as ProgressBarData), data);
        log.i('field updated', prog)
        this.refreshModel.next()
      } else {
        log.i('canno find field')
      }

    })
  }



}
