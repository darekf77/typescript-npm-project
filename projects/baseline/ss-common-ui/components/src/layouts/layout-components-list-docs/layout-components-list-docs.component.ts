import { Component, OnInit, AfterViewInit, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Log, Level } from 'ng2-logger/browser';
import { numValue } from '../../helpers';

const log = Log.create('layout components');

const variables = {
  headerSize: '0px',
  footerSize: '0px',
};


export interface ComponentsMenuItem {
  name: string;
  href?: string;
}

@Component({
  selector: 'app-layout-components-list-docs',
  templateUrl: './layout-components-list-docs.component.html',
  styleUrls: ['./layout-components-list-docs.component.scss']
})
export class LayoutComponentsListDocsComponent implements OnInit, AfterViewInit {

  @Input() menuLeft: ComponentsMenuItem[] = [];

  elements = {
    content: {
      height: 0
    }
  };

  constructor(private router: Router) { }

  ngOnInit() {
  }

  open(item: ComponentsMenuItem) {
    this.router.navigateByUrl(item.href);
  }


  ngAfterViewInit() {
    setTimeout(() => {
      this.recalculatElement();
    });
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
