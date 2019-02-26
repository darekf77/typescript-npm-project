import { Component, OnInit, ViewChild, TemplateRef, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
// third part
import { Subscription } from 'rxjs/Subscription';
import { Morphi } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('multimedia chooser');
// local
import { MultimediaController } from 'ss-common-logic/browser-for-ss-common-ui/apps/multimedia/MultimediaController';
import { MULTIMEDIA } from 'ss-common-logic/browser-for-ss-common-ui/apps/multimedia/MULTIMEDIA';

console.log('heehheh');


@Component({
  selector: 'app-multimedia-chooser',
  templateUrl: './multimedia-chooser.component.html',
  styleUrls: ['./multimedia-chooser.component.scss']
})
export class MultimediaChooserComponent implements OnInit, OnDestroy {


  @Input() selectionType: 'single' | 'multi' = 'single';

  handlers: Subscription[] = [];

  @Input() selected: MULTIMEDIA[] = [];
  @Output() selectedRow = new EventEmitter<MULTIMEDIA | MULTIMEDIA[]>();

  @Input() modelDataConfig: Morphi.CRUD.ModelDataConfig;
  @ViewChild('editTmpl') editTmpl: TemplateRef<any>;
  @ViewChild('hdrTpl') hdrTpl: TemplateRef<any>;

  rows = [];
  columns = [];

  constructor(
    private multimediaController: MultimediaController) {

  }

  async initData() {
    const data = await this.multimediaController.getAll(this.modelDataConfig as any).received;
    this.rows = data.body.json;
    log.i('multimedia', this.rows);
  }

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }

  async ngOnInit() {

    // this.handlers.push(this.modelDataConfig.onChange.subscribe(() => {
    //   // this.initData();
    // }));

    this.columns = [{
      cellTemplate: this.editTmpl,
      headerTemplate: this.hdrTpl,
      prop: 'id'
    }];

    await this.initData();
  }

  onSelect({ selected }) {
    // console.log('Select Event', selected);
    // console.log('selected arr', this.selected);
  }

}
