import { Component, OnInit } from '@angular/core';
import { BUILD } from 'ss-common-logic/browser-for-ss-common-ui/entities/BUILD';
import { TNP_PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/entities/TNP_PROJECT';
import { BuildService } from 'ss-common-logic/browser-for-ss-common-ui/services/BuildService';
import { Observable } from 'rxjs/Observable';
import { BuildController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/BuildController';
import { Log } from 'ng2-logger/browser';

const log = Log.create('privew build tnp ');


@Component({
  selector: 'app-preview-buildtnpprocess',
  templateUrl: './preview-buildtnpprocess.component.html',
  styleUrls: ['./preview-buildtnpprocess.component.scss']
})
export class PreviewBuildtnpprocessComponent implements OnInit {


  constructor(
    // private buildService: BuildService,
    private buildController: BuildController

  ) { }

  model$: Observable<BUILD>;

  async ngOnInit() {
    const builds = await this.buildController.getAll().received;
    log.i('builds', builds.body.json);

    // this.model$ = this.buildService.$observe.byId(1, undefined);

  }

}
