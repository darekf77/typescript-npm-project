import { Component, OnInit, ViewChild, TemplateRef, NgZone } from '@angular/core';
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


@Component({
  selector: 'app-build-editor',
  templateUrl: './build-editor.component.html',
  styleUrls: ['./build-editor.component.scss']
})
export class BuildEditorComponent implements OnInit {

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
  treeOptions = {};

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

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });


  }

  get options() {
    return this.environments ? this.environments.map(e => {
      return { 'value': e, 'label': `${_.upperCase(e)}` }
    }) : []
  };
  environments: EnvironmentName[] = []

  fields = [
    {
      key: 'environmentName',
      type: 'radio',
      templateOptions: {
        // label: 'Radio',
        placeholder: 'Environment',
        // description: 'Description',
        // required: true,
        options: [],
      },
    },
  ] as FormlyFieldConfig[];

  private async refreshModel() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    const data = await this.buildController.getBy(this.id, this.modelDataConfig).received
    this.model = data.body.json;

    this.model.realtimeEntity.subscribe(
      (d) => {
        log.i('BUILD UPDATE FROM SOCKET', d)
        _.merge(this.model, d)
      }
    )
    log.i('REFRESHE and ACTIVATE for sockets model', this.model)


  }

  model: BUILD;

  async ngOnInit() {
    await this.refreshModel()
    await this.getEnvNames()
    await this.getEnv()
  }

  complete() {

  }


  environmentConfig: EnvConfig;
  async getEnv() {
    const data = await this.buildController.getEnvironment(this.model.id).received;
    log.i('environment', data.body.json)
    this.nodes = [data.body.json]
    this.environmentConfig = data.body.json;
  }

  selected: EnvironmentName;



  async getEnvNames() {
    const data = await this.buildController.getEnvironmentNames(this.model.id).received;
    log.i('environment names', data.body.json)
    this.environments = data.body.json.filter(e => !['local', 'online'].includes(e))
    this.fields.find(({ key }) => key === 'environmentName').templateOptions.options = this.options;
  }

}
