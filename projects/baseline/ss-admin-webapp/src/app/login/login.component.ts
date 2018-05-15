import { Component, OnInit, TemplateRef } from '@angular/core';
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';

import { Subscription } from "rxjs/Subscription";
import { Log } from "ng2-logger";
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal/bs-modal.service';


import { Router } from '@angular/router';
const log = Log.create('Login component')

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private auth: AuthController,
    private router: Router
  ) { }

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }


  ngOnInit() {

    this.handlers.push(this.auth.isLoggedIn.subscribe(isLoginIn => {
      if (isLoginIn) {
        this.router.navigateByUrl('/dashboard')
      } else {
        this.router.navigateByUrl('/')
      }
    }))
    log.i('On init login !')
    this.auth.browser.init()
  }


  model = {
    username: 'admin',
    password: 'admin'
  }

  async login(data) {
    this.auth.browser.login(data)
  }

  async info() {
    console.log(await this.auth.info().received)
  }

  async logout() {
    await this.auth.browser.logout()
    // this.hideModal()
  }

}
