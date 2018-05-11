import { Component, OnInit, TemplateRef } from '@angular/core';
import { AuthController } from 'ss-common-logic/browser/controllers/core/AuthController';

import { Log } from "ng2-logger";
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal/bs-modal.service';

import { BaseComponent } from 'ss-common-ui/module';
import { Router } from '@angular/router';
const log = Log.create('Login component')

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends BaseComponent implements OnInit {

  constructor(
    private auth: AuthController,
    private router: Router
  ) {
    super()
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
    this.hideModal()
  }

}
