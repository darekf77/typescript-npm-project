import { Component, OnInit, TemplateRef, Input } from '@angular/core';
import { AuthController } from 'ss-common-logic/browser-for-ss-webapp/apps/auth/AuthController';

import { Subscription } from 'rxjs/Subscription';
import { Log } from 'ng2-logger/browser';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BsModalService } from 'ngx-bootstrap/modal/bs-modal.service';
import { ActivatedRoute } from '@angular/router';

const log = Log.create('Login component')

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent  implements OnInit {

  constructor(
    private auth: AuthController,
    public route: ActivatedRoute,
    private modalService: BsModalService
  ) {

  }

  handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }

  @Input() showDashboard: boolean = true;

  ngOnInit() {

    this.handlers.push(this.auth.isLoggedIn.subscribe(d => {
      log.i('data from auth observable !', d)
      this.hideModal()
    }))
    log.i('On init login !')
    this.auth.browser.init()
  }

  hideModal() {
    if (this.modalRef) {
      this.modalRef.hide()
    }
  }

  modalRef: BsModalRef;

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  model = {
    username: '',
    password: ''
  }

  login(data) {
    this.auth.browser.login(data)
  }

  async info() {
    console.log(await this.auth.info().received)
  }


  async logout() {
    await this.auth.browser.logout()
    this.hideModal()
  }

  observable = {
    isLoggedIn: this.auth.isLoggedIn
  }




}
