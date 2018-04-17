import { Component, OnInit, TemplateRef } from '@angular/core';
import { AuthController } from 'ss-common-logic/browser';

import { Log } from "ng2-logger";
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal/bs-modal.service';
const log = Log.create('Login component')

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private auth: AuthController,
    private modalService: BsModalService
  ) {

  }

  ngOnInit() {
    this.auth.isLoggedIn.subscribe(d => {
      log.i('data from auth observable !', d)
    })
  }

  modalRef: BsModalRef;

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  model = {
    username: 'admin',
    password: 'admin'
  }

  login(data) {
    this.auth.browser.login(data)
  }

  async info() {
    console.log(await this.auth.info().received)
  }

  logout() {
    this.auth.browser.logout()
  }

  observable = {
    isLoggedIn: this.auth.isLoggedIn
  }




}
