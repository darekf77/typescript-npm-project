
import { Component, OnInit, HostListener } from '@angular/core';
// third part
import { Log, Level } from "ng2-logger";
// local
import { CategoryController } from "ss-common-logic/browser/controllers/CategoryController";
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';
import { CATEGORY } from 'ss-common-logic/browser/entities/CATEGORY';
import { Router } from '@angular/router';
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
    private router: Router) {

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
        this.router.navigateByUrl('/dashboard')
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
