import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('build-editor')
import { ModelDataConfig } from 'morphi/browser';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// local
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';


@Component({
  selector: 'app-build-editor',
  templateUrl: './build-editor.component.html',
  styleUrls: ['./build-editor.component.scss']
})
export class BuildEditorComponent implements OnInit {

  modelDataConfig = new ModelDataConfig()
  id: number;

  clear = {
    type: 'button',
    templateOptions: {
      label: 'Clear Build',
      action: async () => {
        this.clear.templateOptions.disabled = true;
        try {
          await this.buildController.clearById(this.model.id).received

          log.i('Project clear complete')
        } catch (e) {
          log.er('error during clear')
        }
        this.clear.templateOptions.disabled = false;
      }
    }
  } as FormlyFieldConfig;

  fields = [
    this.clear,
    {
      type: 'button',
      templateOptions: {
        label: 'Start build',
        action: async () => {
          await this.buildController.startBuildById(this.model.id).received
          await this.getModel()
          log.i('build process started!')
        }
      },
      hideExpression: () => (!this.model || _.isNumber(this.model.pidBuildProces))
    },
    {
      type: 'button',
      templateOptions: {
        label: 'Stop build',
        action: async () => {
          await this.buildController.stopBuildById(this.model.id).received
          await this.getModel()
          log.i('build process stopped!')
        }
      },
      hideExpression: () => (!this.model || !this.model.pidBuildProces)
    },
    {
      type: 'button',
      templateOptions: {
        label: 'See build logs',
        action: async () => {
          this.displayBuildLogs();
        }
      },
      hideExpression: () => (!this.model || !this.model.pidBuildProces)
    },
    {
      type: 'button',
      templateOptions: {
        label: 'Start serve',
        action: async () => {
          await this.buildController.startServeById(this.model.id).received
          await this.getModel()
          log.i('serve process started!')
        }
      },
      hideExpression: () => (!this.model || _.isNumber(this.model.pidServeProces))
    },
    {
      type: 'button',
      templateOptions: {
        label: 'Stop serve',
        action: async () => {
          await this.buildController.stopServeById(this.model.id).received
          await this.getModel()
          log.i('serve process stopped!')
        }
      },
      hideExpression: () => (!this.model || !this.model.pidServeProces)
    },
    {
      type: 'button',
      templateOptions: {
        label: 'See serve logs',
        action: async () => {
          this.displayServeLogs();
        }
      },
      hideExpression: () => (!this.model || !this.model.pidServeProces)
    },
  ] as FormlyFieldConfig[];

  constructor(
    public route: ActivatedRoute,
    private router: Router,
    private matDialog: MatDialog,

    public buildController: BuildController
  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });


  }

  dialogBuild: MatDialogRef<any>;
  dialogServe: MatDialogRef<any>;

  @ViewChild('buildLogs') template_buildLogs: TemplateRef<any>;
  @ViewChild('serveLogs') template_serveLogs: TemplateRef<any>;

  textBuildLogs = ''
  textServeLogs = ''

  isShowingServeLogs = true;
  isShowingBuildLogs = true;

  private async displayBuildLogs() {
    this.isShowingBuildLogs = true;
    if (!this.dialogBuild) {
      this.dialogBuild = this.matDialog.open(this.template_buildLogs)
      this.dialogBuild.afterClosed().subscribe(() => {
        this.isShowingBuildLogs = false;
      })
    }
    const data = await this.buildController.getByIdLastNLinesFromBuildLog(this.model.id, 10).received;
    log.i('displayBuildLogs data', data)
    this.textBuildLogs = data.body.json.join('<br>')
    setTimeout(() => {
      if (this.isShowingBuildLogs) {
        this.displayBuildLogs()
      } else {
        this.dialogBuild = undefined;
      }
    }, 1000)
  }


  private async displayServeLogs() {
    this.isShowingServeLogs = true;
    if (!this.dialogServe) {
      this.dialogServe = this.matDialog.open(this.template_buildLogs)
      this.dialogServe.afterClosed().subscribe(() => {
        this.isShowingServeLogs = false;
      })
    }

    const data = await this.buildController.getByIdLastNLinesFromServeLog(this.model.id, 10).received;
    log.i('displayServeLogs data', data)
    this.textServeLogs = data.body.json.join('<br>')

    setTimeout(() => {
      if (this.isShowingServeLogs) {
        this.displayServeLogs()
      } else {
        this.dialogServe = undefined;
      }
    }, 1000)
  }


  private async getModel() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    const data = await this.buildController.getBy(this.id, this.modelDataConfig).received

    log.i('current build id ', this.id)
    this.model = data.body.json;
    log.i('model', this.model)
  }

  model: BUILD;

  async ngOnInit() {
    await this.getModel()
  }

  complete() {

  }

}
