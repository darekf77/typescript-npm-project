import { Component, OnInit, Input } from '@angular/core';
// other
import { Log, Logger } from 'ng2-logger';
const log = Log.create('dialog-conversations-editor');

import { DialogsController } from '../DialogsController';
import { DIALOG, DialogType } from '../DIALOG';
import { ConfigController, APP_LANGUAGE } from '../../config/ConfigController';

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
