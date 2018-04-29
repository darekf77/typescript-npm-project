
import { Component, OnInit } from '@angular/core';
import { CategoryController } from "ss-common-logic/browser/controllers/CategoryController";

import { Log, Level } from "ng2-logger";
const log = Log.create('Dashboard')

@Component({
  selector: 'app-dashboard-component',
  templateUrl: 'dashboard.component.html'
})

export class DashboardComponent implements OnInit {
  constructor(public categoryCtrl: CategoryController) {

  }

  async ngOnInit() {
    this.categoryCtrl.allCategories().received.then(d => {
      log.i('categories', d)
    })

    this.categoryCtrl.__model.getAll().received.then(d => {
      log.i('categories from base crud', d)
    })


  }


}
