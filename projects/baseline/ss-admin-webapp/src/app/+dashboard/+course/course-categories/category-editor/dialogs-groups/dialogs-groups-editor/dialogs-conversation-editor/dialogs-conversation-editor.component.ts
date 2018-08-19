import { Component, OnInit, Input } from '@angular/core';
// other
import { Log, Logger } from 'ng2-logger/browser';
const log = Log.create('dialog-conversations-editor')
import { ArrayDataConfig } from 'morphi/browser';
import DialogsController from 'ss-common-logic/browser/controllers/DialogsController';
import { DIALOG, DialogType } from 'ss-common-logic/browser/entities/DIALOG';

@Component({
  selector: 'app-dialogs-conversation-editor',
  templateUrl: './dialogs-conversation-editor.component.html',
  styleUrls: ['./dialogs-conversation-editor.component.scss']
})
export class DialogsConversationEditorComponent implements OnInit {

  DialogType = DialogType;
  dialogs: DIALOG[] = [];
  @Input() arrayDataConfig: ArrayDataConfig;

  constructor(public dialogsCRUD: DialogsController) {

  }

  async ngOnInit() {
    const dialogs = await this.dialogsCRUD.getAll(this.arrayDataConfig).received;
    this.dialogs = dialogs.body.json;
    log.i('dialogs', this.dialogs)
  }

}
