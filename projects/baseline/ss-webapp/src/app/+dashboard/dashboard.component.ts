
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
// third part
import { ModelDataConfig } from 'morphi/browser'
import { Log, Level } from "ng2-logger/browser";
import * as _ from 'lodash';
// local
import { CategoryController } from "ss-common-logic/browser-for-ss-webapp/controllers/CategoryController";
import { AuthController } from 'ss-common-logic/browser-for-ss-webapp/controllers/core/AuthController';
import { CATEGORY } from 'ss-common-logic/browser-for-ss-webapp/entities/CATEGORY';
import { Subscription } from 'rxjs/Subscription';

import { stringifyToQueryParams } from 'ss-common-ui/module-for-ss-webapp';
import {GroupsController} from 'ss-common-logic/browser-for-ss-webapp/controllers/GroupsController';
import { GROUP } from 'ss-common-logic/browser-for-ss-webapp/entities/GROUP';

const log = Log.create('Dashboard')

@Component({
  selector: 'app-dashboard-component',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})

export class DashboardComponent implements OnInit {

  modelDataConfigCategory = new ModelDataConfig({
    joins: ['groups', 'groups.picture']
  });

  modelDataConfigGroups = new ModelDataConfig({
    joins: ['dialogs', 'picture']
  });
  constructor(
    public auth: AuthController,
    public route: ActivatedRoute,
    public router: Router,
    public categoryCtrl: CategoryController,
    public groupsController: GroupsController
  ) {

    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });

  }

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }

  selected: CATEGORY;
  selectedGroup: GROUP;
  categories: CATEGORY[] = [];

  content = {
    height: window.innerHeight - 100
  }

  isSelected(category: CATEGORY) {
    return this.selected && this.selected.id == category.id;
  }

  async navigateToCategory(id: number, groupid?: number) {
    let qparams = {
      'categoryid': id
    }
    if (groupid !== undefined) {
      qparams = _.merge(qparams, { groupid })
    }
    const navLink = `/dashboard?${stringifyToQueryParams(qparams)}`
    await this.router.navigateByUrl(navLink)
  }


  async ngOnInit() {
    log.i('oninit')
    const categoryid = Number(this.route.snapshot.queryParamMap.get('categoryid'));

    await this.auth.browser.init()
    const categories = await this.categoryCtrl.allCategories().received
    log.i('categories from base crud', categories.body.json)

    this.categories = categories.body.json;

    let categoryToShow = _.first(this.categories) as CATEGORY;

    if (isNaN(categoryid) || categoryid === 0) {
      await this.navigateToCategory(categoryToShow.id)
    } else {
      categoryToShow = this.categories.find(({ id }) => id === categoryid);
      const data = await this.categoryCtrl.getBy(categoryToShow.id, this.modelDataConfigCategory).received
      this.selected = data.body.json;
      log.i('selected category', this.selected)

      const groupid = Number(this.route.snapshot.queryParamMap.get('groupid'));
      let groupToShow = _.first(this.selected.groups) as GROUP;
      if (isNaN(groupid) || groupid === 0) {
        await this.navigateToCategory(this.selected.id, groupToShow.id)
      } else {
        groupToShow = this.selected.groups.find(({ id }) => id === groupid);
        const data = await this.groupsController.getBy(groupToShow.id, this.modelDataConfigGroups).received
        groupToShow.dialogs = data.body.json.dialogs;
        this.selectedGroup = groupToShow;
        log.i('selected group', groupToShow)
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.content.height = window.innerHeight - 100;
  }


}
