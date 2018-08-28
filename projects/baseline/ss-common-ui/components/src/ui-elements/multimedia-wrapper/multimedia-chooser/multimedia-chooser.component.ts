import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
// third part
import { Describer } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('multimedia chooser');
// local
import { MultimediaController } from 'ss-common-logic/browser/controllers/core/MultimediaController';
import { MULTIMEDIA } from 'ss-common-logic/browser/entities/core/MULTIMEDIA';



@Component({
  selector: 'app-multimedia-chooser',
  templateUrl: './multimedia-chooser.component.html',
  styleUrls: ['./multimedia-chooser.component.scss']
})
export class MultimediaChooserComponent implements OnInit {

  @ViewChild('editTmpl') editTmpl: TemplateRef<any>;
  @ViewChild('hdrTpl') hdrTpl: TemplateRef<any>;

  rows = [];
  columns = [];

  constructor(
    private multimediaController: MultimediaController) {

  }

  async ngOnInit() {

    this.columns = [{
      cellTemplate: this.editTmpl,
      headerTemplate: this.hdrTpl,
      prop: 'id'
    }];

    const data = await this.multimediaController.getAll().received;
    this.rows = data.body.json;
    log.i('multimedia', this.rows);
  }


}
