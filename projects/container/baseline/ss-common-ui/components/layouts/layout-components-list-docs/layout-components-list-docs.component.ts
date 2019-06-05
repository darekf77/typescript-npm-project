import { Component, OnInit, AfterViewInit, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { Log, Level } from 'ng2-logger';
import { numValue } from '../../helpers';

const log = Log.create('layout components', Level.__NOTHING);

const variables = {
  headerSize: '0px',
  footerSize: '0px',
};


export interface ComponentsMenuItem {
  name: string;
  href?: string;
  group?: string;
}

@Component({
  selector: 'app-layout-components-list-docs',
  templateUrl: './layout-components-list-docs.component.html',
  styleUrls: ['./layout-components-list-docs.component.scss']
})
export class LayoutComponentsListDocsComponent implements OnInit, AfterViewInit {

  filter = {
    list: undefined as string,
    change(e: Event) {
      log.i('e', e);
    }
  };

  @Input() menuLeft: ComponentsMenuItem[] = [];

  elements = {
    content: {
      height: 0
    }
  };

  get keyLocalStorageExpandLeft() { // TODO make in more generic
    return 'keyLocalStorageExpandLeftAngular';
  }

  constructor(private router: Router) { }

  ngOnInit() {
    let group;
    this.menuLeft = this.menuLeft.map(item => {
      if (item.group) {
        group = item.group;
      } else if (group) {
        item.group = group;
      }
      return item;
    });

    const leftMenuWidht = localStorage.getItem(this.keyLocalStorageExpandLeft);
    if (_.isString(leftMenuWidht)) {
      const num = Number(leftMenuWidht)
      if (!_.isNaN(num)) {
        this.leftPanelWidth = num;
      }
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.recalculatElement();
    });
  }

  leftPanelWidthDefault = 300;
  leftPanelWidth = this.leftPanelWidthDefault;
  toogleLeftPanel() {
    if (this.leftPanelWidth === this.leftPanelWidthDefault) {
      this.leftPanelWidth = 50;
    } else {
      this.leftPanelWidth = this.leftPanelWidthDefault;
    }
    localStorage.setItem(this.keyLocalStorageExpandLeft, this.leftPanelWidth.toString());
  }

  get calculate() {
    const self = this;
    return {
      get content() {
        return {
          height() {
            self.elements.content.height = window.innerHeight - numValue(variables.footerSize) - numValue(variables.headerSize);
            log.i('window.innerHeight', window.innerHeight);
            log.i('self.content.height ', self.elements.content.height);
          }
        };
      }
    };
  }

  recalculatElement() {
    this.calculate.content.height();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.recalculatElement();
  }

}
