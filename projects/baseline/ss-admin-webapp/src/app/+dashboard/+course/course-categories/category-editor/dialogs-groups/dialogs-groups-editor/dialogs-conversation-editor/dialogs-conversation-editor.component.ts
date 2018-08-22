import { Component, OnInit, Input } from '@angular/core';
// other
import { Log, Logger } from 'ng2-logger/browser';
const log = Log.create('dialog-conversations-editor')
import { ArrayDataConfig } from 'morphi/browser';
import DialogsController from 'ss-common-logic/browser/controllers/DialogsController';
import { DIALOG, DialogType } from 'ss-common-logic/browser/entities/DIALOG';
import { ConfigController, APP_LANGUAGE } from 'ss-common-logic/browser/controllers/ConfigController';

@Component({
  selector: 'app-dialogs-conversation-editor',
  templateUrl: './dialogs-conversation-editor.component.html',
  styleUrls: ['./dialogs-conversation-editor.component.scss']
})
export class DialogsConversationEditorComponent implements OnInit {

  dialogs: DIALOG[] = [];
  @Input() arrayDataConfig: ArrayDataConfig;

  constructor(
    public dialogsCRUD: DialogsController,
    private ConfigController: ConfigController
  ) {

  }

  public clientLang: APP_LANGUAGE;
  public targetLang: APP_LANGUAGE;

  async ngOnInit() {
    const config = await this.ConfigController.instance;
    this.clientLang = config.course_client_language;
    this.targetLang = config.course_target_language;
    log.i('app config', config)
    const dialogs = await this.dialogsCRUD.getAll(this.arrayDataConfig).received;
    this.dialogs = dialogs.body.json;
    log.i('dialogs', this.dialogs)
  }

}
