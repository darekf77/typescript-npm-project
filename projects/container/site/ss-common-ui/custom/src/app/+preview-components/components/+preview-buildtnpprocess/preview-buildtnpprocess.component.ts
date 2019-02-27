import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';
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

  ) { }

  models = []

  async ngOnInit() {


    // this.model$ = this.buildService.$observe.byId(1, undefined);

  }

}
