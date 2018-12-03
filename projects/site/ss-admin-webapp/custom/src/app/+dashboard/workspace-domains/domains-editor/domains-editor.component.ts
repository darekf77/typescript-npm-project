import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ModelDataConfig } from 'morphi/browser';
// other
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('domains-editor')
// local
import {DomainsController} from 'ss-common-logic/browser-for-ss-admin-webapp/controllers/DomainsController';
import { DOMAIN } from 'ss-common-logic/browser-for-ss-admin-webapp/entities/DOMAIN';


@Component({
  selector: 'app-domains-editor',
  templateUrl: './domains-editor.component.html',
  styleUrls: ['./domains-editor.component.scss']
})
export class DomainsEditorComponent implements OnInit {

  model: DOMAIN;

  id: number;
  modelDataConfig = new ModelDataConfig()

  constructor(
    public domainsController: DomainsController,
    public router: Router,
    public route: ActivatedRoute
  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });

  }



  ngOnInit() {
    this.getModel()
  }

  private async getModel() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    const data = await this.domainsController.getBy(this.id, this.modelDataConfig).received

    log.i('current domain id ', this.id)
    this.model = data.body.json;
    log.i('model', this.model)
  }

}
