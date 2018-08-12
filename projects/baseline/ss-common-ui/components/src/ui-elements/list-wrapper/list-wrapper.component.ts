import { Component, OnInit, Input, Output, ViewChild, TemplateRef } from '@angular/core';
import { times } from 'lodash';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { BaseCRUD, Describer } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
import { interpolateParamsToUrl } from 'ng2-rest/browser/params';
import { Router } from '@angular/router';
import { isString } from 'lodash';
import { CATEGORY } from 'ss-common-logic/browser/entities';

const log = Log.create('List wrapper');

export interface CRUDListWrapperLink {
  link: string;
  name: string;
  lock?: boolean;
}

@Component({
  selector: 'app-list-wrapper',
  templateUrl: './list-wrapper.component.html',
  styleUrls: ['./list-wrapper.component.scss']
})
export class ListWrapperComponent implements OnInit {

  constructor(
    private router: Router,
    private dialogService: MatDialog
  ) {

  }

  @ViewChild('create') templateCreate: TemplateRef<any>;

  @Input() icon = 'info';

  isLoading = false;

  @Input() crud: BaseCRUD<any>;

  @Input() links: CRUDListWrapperLink[] = [

  ];

  @Input() data = [
    { link: 'http://onet.pl', name: 'Onet' },
    { link: 'http://google.pl', name: 'Google' }
  ];

  @Input() linkProp = 'name';
  @Input() linkSchema;
  @Input() nameProp = 'href';
  @Input() lockProp = '';

  columns = [
    {
      prop: 'id'
    },
    {
      prop: 'name'
    }
  ];

  dialogRef: MatDialogRef<any>;

  model = {};

  open(d: CRUDListWrapperLink) {
    const link = d.link;
    log.i(`open link: ${link}`);
    if (link && isString(link) && link.trim() !== '') {
      this.router.navigateByUrl(link);
    }
  }

  complete(model) {
    this.data.push(model);
    this.initLinks(this.data);
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }


  async ngOnInit() {

    if (this.lockProp) {
      this.icon = 'lock';
    }

    const columns = Describer.describe(this.crud.entity).map(prop => {
      return { prop };
    });
    this.columns = columns;

    if (this.crud) {
      this.isLoading = true;
      log.i('this.crud.entity', Describer.describe(this.crud.entity));
      try {

        log.i('columns', columns);
        const rows = await this.crud.getAll().received.observable.take(1).toPromise();
        this.isLoading = false;
        this.data = rows.body.json;
        this.initLinks(this.data);
      } catch (error) {
        this.isLoading = false;
      }
    } else {
      this.initLinks(this.data);
    }

  }

  initLinks(rows: any[]) {

    log.i('init links this.linkSchema', this.linkSchema);
    this.links = rows.map(r => {
      if (this.linkSchema) {
        const link = interpolateParamsToUrl(r, this.linkSchema);
        log.i('interpolated link', link);
        const res = { link, name: r[this.nameProp], lock: r[this.lockProp] };
        log.d('res', res);
        return res;
      }
      return { link: r[this.linkProp], name: r[this.nameProp] };
    });
    log.i('links', this.links);
  }

  createDialog() {
    this.model = {};
    this.dialogRef = this.dialogService.open(this.templateCreate);
  }

}
