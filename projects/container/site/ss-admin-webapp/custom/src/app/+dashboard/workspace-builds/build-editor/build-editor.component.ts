import {
  Component, OnInit, ViewChild, TemplateRef,
  NgZone, OnDestroy, AfterViewInit
} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
// material

import { MatDialog, MatDialogRef } from '@angular/material/dialog'
// other
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger';
const log = Log.create('build-editor')

// formly
import { FormlyFieldConfig } from '@ngx-formly/core';
// local
import { BuildController } from 'ss-common-logic/src/controllers/BuildController';
import { TnpProjectController } from 'ss-common-logic/src/controllers/TnpProjectController';


@Component({
  selector: 'app-build-editor',
  templateUrl: './build-editor.component.html',
  styleUrls: ['./build-editor.component.scss']
})
export class BuildEditorComponent implements OnInit, OnDestroy {

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

  ngOnInit() {

  }

  ngOnDestroy() {

  }

}
