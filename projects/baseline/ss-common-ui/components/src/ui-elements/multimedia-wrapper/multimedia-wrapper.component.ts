import { Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
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

  @ViewChild('dialog') private dialog: TemplateRef<any>;

  multimedia: MULTIMEDIA;

  get type(): MultimediaType {
    return this.multimedia && this.multimedia.type as any;
  }

  get mode(): 'view' | 'edit' {
    return this.field.templateOptions.mode ? this.field.templateOptions.mode : 'edit';
  }

  constructor(
    public multimediaController: MultimediaController,
    private matDialog: MatDialog

  ) {
    super();
  }

  open() {
    this.matDialog.open(this.dialog, {
      minWidth: '900px'
    });
  }

  ngOnInit() {
    super.ngOnInit();
    this.multimedia = this.field.templateOptions.multimedia;
    if (!_.isUndefined(this.field.templateOptions.openDialog)) {
      setTimeout(() => {
        this.open();
      });
    }
  }


}
