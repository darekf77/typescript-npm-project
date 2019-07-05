import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NotificationsService, ModalService } from 'ss-components/components';


@Component({
  selector: 'app-notifications-modal',
  templateUrl: './+preview-notifications.component.html',
  styleUrls: ['./+preview-notifications.component.css']
})
export class PreviewNotificaitonsComponent implements OnInit {

  @ViewChild('modalTmp') modalTmp: TemplateRef<any>;

  constructor(
    private notyficaiton: NotificationsService,
    private modal: ModalService

  ) { }

  ngOnInit() {
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

}
