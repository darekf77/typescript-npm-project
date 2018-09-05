
import { Component, OnInit, HostListener } from '@angular/core';
// third part
import { Log, Level } from "ng2-logger";
import * as _ from 'lodash';
// local

import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Menu, MenuItem } from 'ss-common-ui/module';

const log = Log.create('Dashboard')

@Component({
  selector: 'app-dashboard-component',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})

export class DashboardComponent implements OnInit {
  constructor(
    public auth: AuthController,
    public buildController: BuildController,
    private router: Router) {

  }


  menu: Menu = {
    top: {
      items: [
        {
          name: "Builds",
          leftMenu: [
            {
              name: "Worksapces",
              href: '/dashboard/builds',
              subitems: []
            }
          ]
        }
      ]
    }
  }

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }

  content = {
    height: window.innerHeight - 100
  }

  async logout() {
    await this.auth.browser.logout()
  }


  async ngOnInit() {

    const data = await this.buildController.getAll().received;
    log.i('data', data.body.json)

    _.first(_.first(this.menu.top.items).leftMenu).subitems = data.body.json.map(b => {
      return {
        name: b.name,
        href: `/dashboard/builds/build/${b.id}`
      }
    })

    this.handlers.push(this.auth.isLoggedIn.subscribe(isLoginIn => {
      if (isLoginIn) {
        if (this.router.url.trim() === '/') {
          this.router.navigateByUrl('/dashboard')
        }
      } else {
        this.router.navigateByUrl('/')
      }
    }))
    await this.auth.browser.init()

  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.content.height = window.innerHeight - 100;
  }



}
