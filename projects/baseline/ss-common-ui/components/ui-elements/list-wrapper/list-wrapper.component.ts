import { Component, OnInit, Input, Output, ViewChild, TemplateRef } from '@angular/core';
import { times } from 'lodash';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Morphi , ModelDataConfig } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
import { interpolateParamsToUrl } from 'ng2-rest/browser/params';
import { Router } from '@angular/router';
import { isString } from 'lodash';
import { Helpers } from 'morphi/browser/helpers';

const log = Log.create('List wrapper', Level.__NOTHING);

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

  @Input() arrayDataConfig = new Morphi.CRUD.ModelDataConfig();

  @ViewChild('create') templateCreate: TemplateRef<any>;

  @Input() icon = 'info';

  isLoading = false;

  @Input() crud: Morphi.CRUD.Base<any>;

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

  @Input() allowedColumns: string[] = [];

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
    log.i(`CRUD`, this.crud);
    log.i(`CRUD ENTITY`, this.crud && this.crud.entity);
    if (this.lockProp) {
      this.icon = 'lock';
    }

    const columns = Helpers.Class.describeProperites(this.crud.entity)
      .filter(prop => this.allowedColumns.length > 0 ? this.allowedColumns.includes(prop) : true)
      .map(prop => {
        return { prop };
      });
    this.columns = columns;

    if (this.crud) {
      log.i('columns', columns);
      await this.retriveData();

    } else {
      this.initLinks(this.data);
    }

  }

  async retriveData() {
    this.isLoading = true;
    log.i('this.crud.entity', Helpers.Class.describeProperites(this.crud.entity));
    try {
      log.i('this.arrayDataConfig', this.arrayDataConfig);
      const rows = await this.crud.getAll(this.arrayDataConfig).received;
      const totalElements = Number(rows.headers.get(Morphi.SYMBOL.X_TOTAL_COUNT));
      this.isLoading = false;
      if (!isNaN(totalElements)) {
        this.arrayDataConfig.set.pagination.totalElement(totalElements);
      }
      this.data = rows.body.json;
      log.i('init link with ', this.data);
      this.initLinks(this.data);
    } catch (error) {
      this.isLoading = false;
    }
  }

  initLinks(rows: any[]) {

    log.d('init links this.linkSchema', this.linkSchema);
    this.links = rows.map(r => {
      if (this.linkSchema) {
        log.d('interpolated link row', r);
        const link = interpolateParamsToUrl(r, this.linkSchema);
        log.d('interpolated link', link);
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
