import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Log } from 'ng2-logger/browser';

const log = Log.create('privew build tnp ');
import { PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/PROJECT';


@Component({
  selector: 'app-preview-buildtnpprocess',
  templateUrl: './preview-buildtnpprocess.component.html',
  styleUrls: ['./preview-buildtnpprocess.component.scss']
})
export class PreviewBuildtnpprocessComponent implements OnInit {


  constructor(
    // private buildService: BuildService,

  ) { }

  models = []

  async ngOnInit() {
    const projecs = await PROJECT.getAll();
    log.i('projects', projecs)
    // this.model$ = this.buildService.$observe.byId(1, undefined);

  }

}
