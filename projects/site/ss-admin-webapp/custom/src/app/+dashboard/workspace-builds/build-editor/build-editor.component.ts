import {
  Component, OnInit, ViewChild, TemplateRef,
  NgZone, OnDestroy, AfterViewInit
} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
// material

import { MatDialog, MatDialogRef } from '@angular/material/dialog'
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('build-editor')

import { ModelDataConfig } from 'morphi/browser';
// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// local
import { BUILD } from 'ss-common-logic/browser-for-ss-admin-webapp/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser-for-ss-admin-webapp/controllers/BuildController';
import { TnpProjectController } from 'ss-common-logic/browser-for-ss-admin-webapp/controllers/TnpProjectController';
import { TNP_PROJECT } from 'ss-common-logic/browser-for-ss-admin-webapp/entities/TNP_PROJECT';
import { EnvironmentName } from 'tnp-bundle';
import { EnvConfig } from 'tnp-bundle/browser';
import { MatRadioChange } from '@angular/material';


@Component({
  selector: 'app-build-editor',
  // templateUrl: './build-editor.component.html',
  template: `
  <mat-card>
  <app-form-wrapper-material *ngIf="model"
                             [model]="model"
                             [fields]="fields">
  </app-form-wrapper-material>
  </mat-card>
  `,
  styleUrls: ['./build-editor.component.scss']
})
export class BuildEditorComponent implements OnInit, OnDestroy {

  modelDataConfigBuild = new ModelDataConfig({
    joins: ['project',
      'project.children'
    ]
  })

  modelDataConfigProject = new ModelDataConfig({
    joins: ['children']
  })

  id: number;

  environments: EnvironmentName[] = []

  fields: FormlyFieldConfig[] = [];

  model: BUILD;

  nodes = [];
  environmentConfig: EnvConfig;
  selected: EnvironmentName;

  @ViewChild('tree') tree;
  treeOptions = { isExpandedField: 'expanded' }



  constructor(
    public route: ActivatedRoute,
    private router: Router,
    public buildController: BuildController,
    public projectController: TnpProjectController
  ) {


    // router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    //     this.router.navigated = false;
    //     window.scrollTo(0, 0);
    //   }
    // });

    /// QUICK FIX FOR REFRESH MODEL
    router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

  }

  get options() {
    return this.environments ? this.environments.map(e => {
      return { 'value': e, 'label': `${_.upperCase(e)}` }
    }) : []
  };



  async ngOnInit() {

    this.fields = [
      {
        key: 'environmentName',
        type: 'radio',
        templateOptions: {
          // label: 'Radio',
          placeholder: 'Environment',
          // description: 'Description',
          // required: true,
          options: [],
          change: async (field, change: MatRadioChange) => {
            // log.i('environment changed to: ', change.value)
            // const data = await this.buildController.changeEnvironment(this.model.id, change.value).received
            // this.model.pidChangeEnvProces = data.body.json.pidChangeEnvProces;
          }
        },
        // expressionProperties: {
        //   'templateOptions.disabled': () => {
        //     return !this.model || _.isNumber(this.model.pidChangeEnvProces)
        //   }
        // }
      },
    ] as FormlyFieldConfig[];


    await this.updateModel()
  }

  complete() { }



  objectToNode(o: any, ValueKey: string | number = '', parentObj: any = {}) {
    // log.color = 'red'
    // log.d('ValueKey', ValueKey)
    if (!_.isArray(o) && !_.isObject(o)) {
      // log.d('is simple', o)
      return {
        type: typeof o,
        name: ValueKey,
        isSimple: true,
        get value() {
          return o;
        },
        set value(v) {
          parentObj[ValueKey] = v;
        }
      }
    }
    if (_.isArray(o)) {
      // log.d('is array', o)
      return {
        name: ValueKey,
        children: o.map((va, i) => {
          return this.objectToNode(va, i, o);
        })
      }
    }
    // log.d('is object', o)
    return {
      name: o.name ? o.name : ValueKey,
      children: Object
        .keys(o)
        .filter(objKey => objKey !== 'name')
        .map(objKey => {
          return this.objectToNode(o[objKey], objKey, o)
        })
    }

  }

  nodeValue(v) {
    if (_.isBoolean(v)) {
      return v ? 'true' : 'false'
    }
    return v
  }



  async updateProject(project: TNP_PROJECT) {
    project.realtimeEntity.subscribe(async () => {
      const data = await this.projectController.getBy(this.model.project.id, this.modelDataConfigProject).received
      log.i('REALTIME ACTION PROJECT', data)
      _.merge(project, data.body.json)
    })
  }

  async updateModel() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    let data = await this.buildController.getBy(this.id, this.modelDataConfigBuild).received
    this.model = data.body.json;
    log.i('MODEL', this.model)

    this.model.realtimeEntity.subscribe(async () => {
      data = await this.buildController.getBy(this.id, this.modelDataConfigBuild).received
      log.i('REALTIME ACTION BUILD', data)
      _.merge(this.model, data.body.json)
      await this.getEnv()
      await this.getEnvNames()
    })
    this.updateProject(this.model.project);

    await this.getEnv()
    await this.getEnvNames()
  }

  private async getEnv() {
    // const data = await this.buildController.getEnvironment(this.model.id).received;
    // // log.i('environment', data.body.json)
    // let body = data.body.json;
    // if (_.isObject(body)) {
    //   body.packageJSON = undefined;
    //   const n = this.objectToNode(body).children;


    //   this.nodes = n;
    //   this.environmentConfig = body;
    //   if (this.model && this.model.project && this.model.project.children
    //     && body.workspace && body.workspace.projects
    //   ) {
    //     this.model.project.children.forEach(c => {
    //       let s = body.workspace.projects.find(p => p.name === c.name);
    //       _.merge(c, s);
    //     })
    //   }
    // } else {
    //   log.er('tmp-environment.json is not generated')
    // }

  }

  private async getEnvNames() {
    // const data = await this.buildController.getEnvironmentNames(this.model.id).received;
    // // log.i('environment names', data.body.json)
    // this.environments = data.body.json.filter(e => !['local'].includes(e))
    // this.fields.find(({ key }) => key === 'environmentName').templateOptions.options = this.options;
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.model.realtimeEntity.unsubscribe()
    this.model.project.realtimeEntity.unsubscribe()
  }

}
