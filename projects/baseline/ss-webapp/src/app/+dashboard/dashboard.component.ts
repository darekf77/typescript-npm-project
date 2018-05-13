
import { Component, OnInit, HostListener } from '@angular/core';
// third part
import { Log, Level } from "ng2-logger";
// local
import { CategoryController } from "ss-common-logic/browser/controllers/CategoryController";
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import { Subscription } from 'rxjs/Subscription';

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

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }

  selected: CATEGORY;
  categories: CATEGORY[] = [];

  content = {
    height: window.innerHeight - 100
  }

  isSelected(category: CATEGORY) {
    return this.selected && this.selected.id == category.id;
  }

  async showCategory(category: CATEGORY) {
    const cat = await this.categoryCtrl.categoryBy(category.id).received;
    log.i('slected category', cat)
    this.selected = cat.body.json;
  }

  async ngOnInit() {
    await this.auth.browser.init()
    const categories = await this.categoryCtrl.allCategories().received
    log.i('categories from base crud', categories.body.json)
    this.categories = categories.body.json;
    await this.showCategory(this.categories[0])
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.content.height = window.innerHeight - 100;
  }



}
