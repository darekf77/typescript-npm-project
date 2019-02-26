import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
// other
import { Log, Logger } from 'ng2-logger/browser';
const log = Log.create('dialog part');
// local
import { DialogType, DIALOG } from 'ss-common-logic/browser-for-ss-common-ui/apps/dialog/DIALOG';
import { ConfigController, APP_LANGUAGE } from 'ss-common-logic/browser-for-ss-common-ui/apps/config/ConfigController';
import { DialogsController } from 'ss-common-logic/browser-for-ss-common-ui/apps/dialog/DialogsController';
import { FormlyFieldConfig } from '@ngx-formly/core';


@Component({
  selector: 'app-dialog-part',
  templateUrl: './dialog-part.component.html',
  styleUrls: ['./dialog-part.component.scss']
})
export class DialogPartComponent implements OnInit {


  get type() {
    return this.dialog && this.dialog.type;
  }

  constructor(
    private configController: ConfigController,
    public dialogsController: DialogsController
  ) { }



  @Input() isEditingInline = false;

  fields = [
    {
      key: 'lang_pl',
      type: 'editorwrapper',
      hideExpression: () => this.clientLang === 'en'
    },
    {
      key: 'audio_pl',
      type: 'multimediawrapper',
      hideExpression: () => this.clientLang === 'en',
      templateOptions: {
        label: 'Polskie audio'
      }
    },
    {
      id: 'translateButton',
      type: 'button',
      templateOptions: {
        label: 'Translate'
      }
    },
    {
      key: 'lang_fr',
      type: 'editorwrapper'
    },
    {
      key: 'audio_fr',
      type: 'multimediawrapper',
      templateOptions: {
        label: 'French audio'
      }
    },
    {
      key: 'lang_en',
      type: 'editorwrapper',
      hideExpression: () => this.clientLang === 'pl'
    },
    {
      key: 'audio_en',
      type: 'multimediawrapper',
      hideExpression: () => this.clientLang === 'pl',
      templateOptions: {
        label: 'English audio'
      }
    },
  ] as FormlyFieldConfig[];

  DialogType = DialogType;
  @Input() mode: 'view' | 'edit' = 'edit';

  @Input() dialog: DIALOG;

  @Input() clientLang: APP_LANGUAGE;
  @Input() targetLang: APP_LANGUAGE;

  @Output() editing = new EventEmitter();

  toogleEditing() {
    this.isEditingInline = !this.isEditingInline;
    // if (this.isEditingInline) {
    //   this.editing.next(this.dialog)
    // }
  }

  complete() {

  }

  ngOnInit() {

  }

}
