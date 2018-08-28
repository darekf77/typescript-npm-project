import { Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { BaseCRUD, ModelDataConfig } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('multimedia wrapper');
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

  isReload = false;
  modelDataConfig = new ModelDataConfig();
  @ViewChild('dialog') private dialog: TemplateRef<any>;

  multimedia: MULTIMEDIA;

  get type(): MultimediaType {
    return this.multimedia && this.multimedia.type as any;
  }

  get mode(): 'view' | 'edit' {
    return this.field.templateOptions.mode ? this.field.templateOptions.mode : 'edit';
  }

  typeToString(selection: number): MultimediaType {
    if (selection === 1) { return 'picture'; }
    if (selection === 2) { return 'audio'; }
    if (selection === 3) { return 'video'; }
    return undefined;
  }

  constructor(
    public multimediaController: MultimediaController,
    private matDialog: MatDialog

  ) {
    super();
  }

  typeChange(e) {
    const t = this.typeToString(e) as MultimediaType;
    log.i('typechange ', t);
    this.modelDataConfig.set.where(`type=${t}`);
    this.isReload = true;
    setTimeout(() => {
      this.isReload = false;
    });
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
