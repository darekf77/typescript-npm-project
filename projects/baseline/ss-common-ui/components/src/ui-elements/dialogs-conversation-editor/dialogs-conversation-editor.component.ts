import { Component, OnInit, Input } from '@angular/core';
// other
import { Log, Logger } from 'ng2-logger/browser';
const log = Log.create('dialog-conversations-editor');

import DialogsController from 'ss-common-logic/browser/controllers/DialogsController';
import { DIALOG, DialogType } from 'ss-common-logic/browser/entities/DIALOG';
import { ConfigController, APP_LANGUAGE } from 'ss-common-logic/browser/controllers/ConfigController';

@Component({
  selector: 'app-dialogs-conversation-editor',
  templateUrl: './dialogs-conversation-editor.component.html',
  styleUrls: ['./dialogs-conversation-editor.component.scss']
})
export class DialogsConversationEditorComponent implements OnInit {

  constructor(
    public dialogsCRUD: DialogsController,
    private configController: ConfigController
  ) {

  }

  @Input() dialogs: DIALOG[] = [];

  @Input() mode = 'edit';

  public clientLang: APP_LANGUAGE;
  public targetLang: APP_LANGUAGE;

  async ngOnInit() {
    const config = await this.configController.instance;
    this.clientLang = config.course_client_language;
    this.targetLang = config.course_target_language;
    log.i('app config', config);
  }

}
