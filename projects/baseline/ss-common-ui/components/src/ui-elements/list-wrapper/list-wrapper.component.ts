import { Component, OnInit, Input, Output } from '@angular/core';
import { times } from 'lodash';
import { BaseCRUD } from 'morphi/browser';
import { META } from 'ss-common-logic/browser/helpers';
import { Log, Level } from 'ng2-logger/browser';
import { interpolateParamsToUrl } from 'ng2-rest/browser/params';
import { Router } from '@angular/router';
import { isString } from 'lodash';

const log = Log.create('List wrapper', Level.__NOTHING);

export interface CRUDListWrapperLink {
  link: string;
  name: string;
}

@Component({
  selector: 'app-list-wrapper',
  templateUrl: './list-wrapper.component.html',
  styleUrls: ['./list-wrapper.component.scss']
})
export class ListWrapperComponent implements OnInit {

  constructor(private router: Router) {

  }

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

  columns = [
    {
      prop: 'id'
    },
    {
      prop: 'name'
    }
  ];

  open(d: CRUDListWrapperLink) {
    const link = d.link;
    log.i(`open link: ${link}`);
    if (link && isString(link) && link.trim() !== '') {
      this.router.navigateByUrl(link);
    }
  }

  async ngOnInit() {
    const columns = META.Describer.describe(this.crud.entity).map(prop => {
      return { prop };
    });
    this.columns = columns;

    if (this.crud) {
      this.isLoading = true;
      log.i('this.crud.entity', META.Describer.describe(this.crud.entity));
      try {

        log.i('columns', columns);
        const rows = await this.crud.getAll().received.observable.take(1).toPromise();
        this.isLoading = false;
        this.initLinks(rows.body.json);
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
        return { link, name: r[this.nameProp] };
      }
      return { link: r[this.linkProp], name: r[this.nameProp] };
    });
    log.i('links', this.links);
  }


}
