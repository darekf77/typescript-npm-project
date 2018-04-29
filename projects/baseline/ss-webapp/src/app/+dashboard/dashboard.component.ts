
import { Component, OnInit } from '@angular/core';
// third part
import { Log, Level } from "ng2-logger";
// local
import { CategoryController } from "ss-common-logic/browser/controllers/CategoryController";
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';

const log = Log.create('Dashboard')

@Component({
  selector: 'app-dashboard-component',
  templateUrl: 'dashboard.component.html'
})

export class DashboardComponent implements OnInit {
  constructor(
    public auth: AuthController,
    public categoryCtrl: CategoryController) {

  }

  async ngOnInit() {
    await this.auth.browser.init()
    const categories = await this.categoryCtrl.allCategories().received

    debugger
    log.i('categories from base crud', categories.body.json)
  }


}
