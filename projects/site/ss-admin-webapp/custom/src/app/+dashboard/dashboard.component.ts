
import { Component, OnInit, HostListener, NgZone, ApplicationRef } from '@angular/core';
// third part
import { Log, Level } from 'ng2-logger';
import * as _ from 'lodash';
// local

import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { BuildController } from 'ss-common-logic/browser/controllers/BuildController';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Menu, MenuItem } from 'ss-common-ui/module';
import { DomainsController } from 'ss-common-logic/browser/controllers/DomainsController';
import { Global } from 'morphi/browser';

const log = Log.create('Dashboard', Level.__NOTHING);

@Component({
  selector: 'app-dashboard-component',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})

export class DashboardComponent implements OnInit {
  constructor(
    public auth: AuthController,
    public buildController: BuildController,
    public domainsController: DomainsController,
    public ref: ApplicationRef,
    public ngZone: NgZone,
    private router: Router) {

    Global.vars.ngZone = ngZone;
    Global.vars.ApplicationRef = ref;
  }


  menu: Menu = {
    top: {
      items: [
        {
          name: 'Builds',
          leftMenu: [
            {
              name: 'Builds',
              subitems: []
            },

            // {
            //   name: 'Domains',
            //   subitems: []
            // }

          ]
        }
      ]
    }
  };

  handlers: Subscription[] = [];

  content = {
    height: window.innerHeight - 100
  };

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }

  async logout() {
    await this.auth.browser.logout();
  }


  async getBuilds() {
    const data = await this.buildController.getAll().received;
    log.i('data', data.body.json);
    return data.body.json.map(b => {
      return {
        name: b.name,
        href: `/dashboard/builds/build/${b.id}`,
        id: b.id
      };
    });
  }

  async getDomains() {
    const data = await this.domainsController.getAll().received;
    log.i('data', data.body.json);
    return data.body.json.map(b => {
      return {
        name: b.name,
        href: `/dashboard/domains/domain/${b.id}`,
        id: b.id
      };
    });
  }

  async ngOnInit() {



    const builds = _.first(this.menu.top.items).leftMenu[0];
    builds.action = () => {
      const id = _.first(builds.subitems)['id'];
      log.i('navigate hererere to build id ', id);
      this.router.navigateByUrl(`/dashboard/builds/build/${id}`);
    };
    builds.subitems = await this.getBuilds();

    // const domains = _.first(this.menu.top.items).leftMenu[1];
    // domains.action = () => {
    //   const id = _.first(domains.subitems)['id'];
    //   log.i('navigate hererere to domain id ', id);
    //   this.router.navigateByUrl(`/dashboard/domains/domain/${id}`);
    // };
    // domains.subitems = await this.getDomains();




    this.handlers.push(this.auth.isLoggedIn.subscribe(isLoginIn => {
      if (isLoginIn) {
        if (this.router.url.trim() === '/') {
          this.router.navigateByUrl('/dashboard');
        }
      } else {
        this.router.navigateByUrl('/');
      }
    }));
    await this.auth.browser.init();

  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.content.height = window.innerHeight - 100;
  }



}
