import { Component, OnInit } from '@angular/core';
import { Log, Level } from 'ng2-logger/browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { ModelDataConfig } from 'morphi/browser';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';
const log = Log.create('build-editor')


@Component({
  selector: 'app-build-editor',
  templateUrl: './build-editor.component.html',
  styleUrls: ['./build-editor.component.scss']
})
export class BuildEditorComponent implements OnInit {

  modelDataConfig = new ModelDataConfig()
  id: number;

  fields = []

  constructor(
    public route: ActivatedRoute,
    private router: Router,

    public buildController: BuildController
  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });

    this.id = Number(this.route.snapshot.paramMap.get('id'));


    log.i('current build id ', this.id)
  }

  model: BUILD;

  ngOnInit() {

  }

  complete() {

  }

}
