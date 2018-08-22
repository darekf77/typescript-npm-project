import { Component, OnInit, Input } from '@angular/core';
// other
import { Log, Logger } from 'ng2-logger/browser';
const log = Log.create('dialog part')
// local
import { DialogType, DIALOG } from 'ss-common-logic/browser/entities/DIALOG';
import { ConfigController, APP_LANGUAGE } from 'ss-common-logic/browser/controllers/ConfigController';



@Component({
  selector: 'app-dialog-part',
  templateUrl: './dialog-part.component.html',
  styleUrls: ['./dialog-part.component.scss']
})
export class DialogPartComponent implements OnInit {

  DialogType = DialogType;

  @Input() dialog: DIALOG;

  @Input() clientLang: APP_LANGUAGE;
  @Input() targetLang: APP_LANGUAGE;

  get type() {
    return this.dialog && this.dialog.type
  }

  constructor(private ConfigController: ConfigController) { }

  ngOnInit() {

  }

}
