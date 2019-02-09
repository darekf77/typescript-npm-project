import { Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { Morphi, ModelDataConfig } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('multimedia wrapper');
// local
import { MultimediaController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/core/MultimediaController';
import { MultimediaType, MULTIMEDIA } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/MULTIMEDIA';
import { MatDialog, MatDialogRef } from '@angular/material';

export type DialogAction = 'select' | 'upload';


@Morphi.Formly.RegisterComponentAsType('MultimediaWrapperComponent')
@Component({
  selector: 'app-multimedia-wrapper',
  templateUrl: './multimedia-wrapper.component.html',
  styleUrls: ['./multimedia-wrapper.component.scss']
})
export class MultimediaWrapperComponent extends FieldType implements OnInit {

  isReload = false;
  currentAction: DialogAction = 'select';
  selectionType: 'single' | 'multi' = 'single';
  dialogRef: MatDialogRef<any>;
  modelDataConfig = new Morphi.CRUD.ModelDataConfig();
  @ViewChild('dialog') private dialog: TemplateRef<any>;


  get multimedia(): MULTIMEDIA {
    return this.formControl.value;
  }
  selected: MULTIMEDIA[] = [];

  get type(): MultimediaType {
    return this.multimedia && this.multimedia.type as any;
  }

  get mode(): 'view' | 'edit' {
    return this.field.templateOptions.mode ? this.field.templateOptions.mode : 'edit';
  }

  actionToString(action: number): DialogAction {
    log.i('action num', action);
    if (action === 0) { return 'select'; }
    if (action === 1) { return 'upload'; }
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

  removeMultimedia() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.formControl.setValue(undefined);
  }

  selectMultimedia() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    if (this.selectionType === 'single') {
      this.formControl.setValue(_.first(this.selected));
    } else {
      this.formControl.setValue(this.selected);
    }
    log.i('form control value', this.formControl.value);
  }

  actionChange(e) {
    this.currentAction = this.actionToString(e);
  }

  typeChange(e) {
    this.selected.length = 0;
    const t = this.typeToString(e) as MultimediaType;
    log.i('typechange ', t);
    this.modelDataConfig.set.where(`type=${t}`);
    this.isReload = true;
    setTimeout(() => {
      this.isReload = false;
    });
  }

  open() {
    this.dialogRef = this.matDialog.open(this.dialog, {
      minWidth: '600px'
    });
  }

  ngOnInit() {
    super.ngOnInit();
    if (!_.isUndefined(this.field.templateOptions.openDialog)) {
      setTimeout(() => {
        this.open();
      });
    }
  }


}
