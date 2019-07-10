import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NotificationsService, ModalService } from 'ss-components/components';
import { Resource } from 'ng2-rest';
import { BaseComponent } from 'ss-helpers/components/base-component';
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';

@Component({
  selector: 'app-notifications-modal',
  templateUrl: './+preview-notifications.component.html',
  styleUrls: ['./+preview-notifications.component.css']
})
export class PreviewNotificaitonsComponent extends BaseComponent implements OnInit {

  @ViewChild('modalTmp') modalTmp: TemplateRef<any>;

  constructor(
    private notyficaiton: NotificationsService,
    private modal: ModalService,
    private ctrl: ExamplesController

  ) {
    super()
  }

  ngOnInit() {
    this.handlers.push(Resource.listenErrors.subscribe(err => {
      console.log(err);
    }))
  }

  show() {
    this.notyficaiton.info('info');
    this.notyficaiton.error('error');
    this.notyficaiton.success('success');
    this.notyficaiton.warn('warn');

    // t.onTap.subscribe(() => {
    //   this.modal.open(this.modalTmp);
    // });
  }

  async backendErr() {
    await this.ctrl.backendError().received
  }

}
