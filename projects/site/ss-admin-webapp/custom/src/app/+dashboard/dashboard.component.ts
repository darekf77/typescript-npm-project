
import { Component, OnInit, HostListener } from '@angular/core';
// third part
import { Log, Level } from "ng2-logger";
// local

import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';

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
              subitems: [
                {
                  name: 'Project 1',
                  href: '/dashboard/builds'
                },
                {
                  name: 'Project 2',
                  href: '/dashboard/builds'
                }
              ]
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
