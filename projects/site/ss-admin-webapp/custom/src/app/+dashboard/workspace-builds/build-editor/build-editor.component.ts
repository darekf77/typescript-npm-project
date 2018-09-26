import { Component, OnInit, ViewChild, TemplateRef, NgZone, AfterViewInit } from '@angular/core';
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
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { EnvironmentName } from 'tnp-bundle';
import { EnvConfig } from 'tnp-bundle/browser';
import { MatRadioChange } from '@angular/material';


@Component({
  selector: 'app-build-editor',
  templateUrl: './build-editor.component.html',
  styleUrls: ['./build-editor.component.scss']
})
export class BuildEditorComponent implements OnInit, AfterViewInit {


  modelDataConfig = new ModelDataConfig({
    joins: ['project', 'project.children']
  })
  id: number;


  constructor(
    public route: ActivatedRoute,
    private router: Router,
    private matDialog: MatDialog,
    private ngZone: NgZone,

    public buildController: BuildController
  ) {

    // router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    //     this.ngOnInit();
    //   }
    // });


  }

  get options() {
    return this.environments ? this.environments.map(e => {
      return { 'value': e, 'label': `${_.upperCase(e)}` }
    }) : []
  };
  environments: EnvironmentName[] = []

  fields: FormlyFieldConfig[] = [];

  private async refreshModel() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    let data = await this.buildController.getBy(this.id, this.modelDataConfig).received
    this.model = data.body.json;

    this.model.realtimeEntity.subscribe(
      async () => {
        log.i('BUILD UPDATE FROM SOCKET')
        data = await this.buildController.getBy(this.id, this.modelDataConfig).received
        _.merge(this.model, data.body.json);
        // await this.getEnvNames()
        await this.getEnv()
      }
    )
    log.i('REFRESHE and ACTIVATE for sockets model', this.model)

  }

  model: BUILD;

  async ngOnInit() {
    log.i('ON INIT')

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
            log.i('environment changed to: ', change.value)
            const data = await this.buildController.changeEnvironment(this.model.id, change.value).received
            this.model.pidChangeEnvProces = data.body.json.pidChangeEnvProces;
          }
        },
        expressionProperties: {
          'templateOptions.disabled': () => {
            return !this.model || _.isNumber(this.model.pidChangeEnvProces)
          }
        }
      },
    ] as FormlyFieldConfig[];


    await this.refreshModel()
    await this.getEnvNames()
    await this.getEnv()
  }

  complete() {

  }

  nodes = [
    {
      id: 1,
      name: 'root1',
      children: [
        { id: 2, name: 'child1' },
        { id: 3, name: 'child2' }
      ]
    },
    {
      id: 4,
      name: 'root2',
      children: [
        { id: 5, name: 'child2.1' },
        {
          id: 6,
          name: 'child2.2',
          children: [
            { id: 7, name: 'subsub' }
          ]
        }
      ]
    }
  ];

  @ViewChild('tree') tree;
  treeOptions = { isExpandedField: 'expanded' }

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

  environmentConfig: EnvConfig;
  async getEnv() {
    const data = await this.buildController.getEnvironment(this.model.id).received;
    log.i('environment', data.body.json)
    let body = data.body.json;
    body.packageJSON = undefined;
    const n = this.objectToNode(body).children;


    this.nodes = n;
    this.environmentConfig = body;
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    // this.tree.treeModel.expandAll();
  }

  selected: EnvironmentName;



  async getEnvNames() {
    const data = await this.buildController.getEnvironmentNames(this.model.id).received;
    log.i('environment names', data.body.json)
    this.environments = data.body.json.filter(e => !['local', 'online'].includes(e))
    this.fields.find(({ key }) => key === 'environmentName').templateOptions.options = this.options;
  }

}
