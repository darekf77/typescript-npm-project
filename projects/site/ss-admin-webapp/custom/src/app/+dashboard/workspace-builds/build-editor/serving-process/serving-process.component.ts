import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// third part
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('building process')
// local
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';

@Component({
  selector: 'app-serving-process',
  templateUrl: './serving-process.component.html',
  styleUrls: ['./serving-process.component.scss']
})
export class ServingProcessComponent implements OnInit {

  fields = [
    {
      fieldGroupClassName: 'display-flex',
      fieldGroup: [
        {
          className: 'flex-1',
          type: 'button',
          templateOptions: {
            label: 'Start serve',
            action: async () => {
              await this.buildController.startServeById(this.model.id).received
              this.refreshModel.emit()
              log.i('serve process started!')
            }
          },
          hideExpression: () => (!this.model || _.isNumber(this.model.pidServeProces))
        },
        {
          className: 'flex-1',
          type: 'button',
          templateOptions: {
            label: 'Stop serve',
            action: async () => {
              await this.buildController.stopServeById(this.model.id).received
              this.refreshModel.emit()
              log.i('serve process stopped!')
            }
          },
          hideExpression: () => (!this.model || !this.model.pidServeProces)
        },
        {
          className: 'flex-1',
          type: 'button',
          templateOptions: {
            label: 'See serve logs',
            action: async () => {
              this.displayServeLogs();
            }
          },
          hideExpression: () => (!this.model || !this.model.pidServeProces)
        },
      ]
    },
    {
      fieldGroupClassName: 'display-flex',
      fieldGroup: [
        {
          className: 'flex-1',
          template: `
            <h3>Realtime serve logs:</h3>
            <h4 *ngIf="!textServeLogs"> <strong>empty serve logs files</strong> </h4>
            <code *ngIf="textServeLogs"
              [innerHtml]="textServeLogs">
            </code>
          `
        }
      ]
    }
  ] as FormlyFieldConfig[]

  textServeLogs = ''
  isShowingServeLogs = false;

  @Input() model: BUILD;
  @Output() refreshModel = new EventEmitter();

  constructor(
    public buildController: BuildController
  ) { }

  ngOnInit() {
  }


  private async displayServeLogs() {

    this.isShowingServeLogs = true;

    const data = await this.buildController.getByIdLastNLinesFromServeLog(this.model.id, 10).received;
    log.i('displayServeLogs data', data)
    this.textServeLogs = data.body.json.join('<br>')

    setTimeout(() => {
      if (this.isShowingServeLogs) {
        this.displayServeLogs()
      }
    }, 1000)
  }


}
