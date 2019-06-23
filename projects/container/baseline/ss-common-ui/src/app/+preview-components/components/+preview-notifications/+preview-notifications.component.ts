import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NotificationsService, ModalService } from 'components';


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
    const t = this.notyficaiton.success('hello', 'world')

    t.onTap.subscribe(() => {
      this.modal.open(this.modalTmp);
    });
  }

}
