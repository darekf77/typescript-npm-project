import { Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
// other
import { BaseCRUD } from 'morphi/browser';
// local
import { MultimediaController } from 'ss-common-logic/browser/controllers/core/MultimediaController';
import { MultimediaType, MULTIMEDIA } from 'ss-common-logic/browser/entities/core/MULTIMEDIA';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-multimedia-wrapper',
  templateUrl: './multimedia-wrapper.component.html',
  styleUrls: ['./multimedia-wrapper.component.scss']
})
export class MultimediaWrapperComponent extends FieldType implements OnInit {

  @ViewChild('dialog')
  private dialog: TemplateRef<any>;
  type: MultimediaType;

  @Input() crud: BaseCRUD<any>;

  constructor(
    public multimediaController: MultimediaController,
    private materialDialog: MatDialog

  ) {
    super();
  }

  open() {
    this.materialDialog.open(this.dialog, {
      minWidth: '900px'
    });
  }


}
