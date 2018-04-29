
import { Component, OnInit } from '@angular/core';
// third part
import { Log, Level } from "ng2-logger";
// local
import { CategoryController } from "ss-common-logic/browser/controllers/CategoryController";
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';

const log = Log.create('Dashboard')

@Component({
  selector: 'app-dashboard-component',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})

export class DashboardComponent implements OnInit {
  constructor(
    public auth: AuthController,
    public categoryCtrl: CategoryController) {

  }

  categories: CATEGORY[] = [];

  content = {
    height() {
      return window.innerHeight - 100;
    }
  }

  async ngOnInit() {
    await this.auth.browser.init()
    const categories = await this.categoryCtrl.allCategories().received
    log.i('categories from base crud', categories.body.json)
    this.categories = categories.body.json;
  }


}
