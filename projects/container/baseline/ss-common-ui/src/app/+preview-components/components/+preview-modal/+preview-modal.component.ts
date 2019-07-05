import { Component, OnInit, TemplateRef } from '@angular/core';

import { ModalService } from 'ss-components/components';

@Component({
  selector: 'app-preview-modal',
  templateUrl: './+preview-modal.component.html',
  styleUrls: ['./+preview-modal.component.css']
})
export class PreviewModalComponent implements OnInit {

  constructor(
    private modal: ModalService
  ) { }

  ngOnInit() {
  }

  show(template: TemplateRef<any>) {
    this.modal.open(template);
  }

}
