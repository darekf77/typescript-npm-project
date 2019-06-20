
import { Component, OnInit, HostListener } from '@angular/core';
// third part
import { Log, Level } from 'ng2-logger/browser';
// local
import { CategoryController } from 'ss-common-logic/browser-for-ss-admin-webapp/apps/category/CategoryController';
import { AuthController } from 'ss-common-logic/browser-for-ss-admin-webapp/apps/auth/AuthController';
import { CATEGORY } from 'ss-common-logic/browser-for-ss-admin-webapp/apps/category/CATEGORY';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Menu } from 'ss-common-ui/browser-for-ss-admin-webapp';

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
          name: "Content Manager",
          leftMenu: [
            {
              name: "Course",
              href: '/dashboard/course',
              subitems: [
                {
                  name: 'Introduction',
                  href: '/dashboard/course/introduction'
                },
                {
                  name: 'Categories',
                  href: '/dashboard/course/categories'
                }
              ]
            },
            {
              name: "Main page",
              subitems: [
                {
                  name: 'Slider'
                },
                {
                  name: 'Description'
                }
              ]
            }
          ]
        },
        {
          name: "Administration",
          leftMenu: [
            {
              name: "Media",
              subitems: [
                {
                  name: 'Manage library'
                },
                {
                  name: 'Settings'
                }
              ]
            },
            {
              name: "Users",
              subitems: [
                {
                  name: 'Manage users'
                },
                {
                  name: 'Settings'
                }
              ]
            },
            {
              name: "Payments",
              subitems: [
                {
                  name: 'History'
                },
                {
                  name: 'Settings'
                }
              ]
            }
          ]
        },
        {
          name: "Statistics",
          leftMenu: [
            {
              name: "Money",
              subitems: [
                {
                  name: 'This month'
                },
                {
                  name: 'All'
                }
              ]
            },
            {
              name: "User",
              subitems: [
                {
                  name: 'Trafic'
                },
                {
                  name: 'Focus'
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
