
import {
  Component, OnInit, HostBinding, AfterViewInit, AfterContentInit,
  HostListener, Input, ElementRef, ViewChild, ContentChildren, QueryList
} from '@angular/core';

import { Log, Level } from 'ng2-logger';
import { numValue } from '../../helpers';

export interface LayoutMaterialVariables {
  footerSize: string;
  headerSize: string;
  leftPanelSize: string;
}

const variables: LayoutMaterialVariables = {
  headerSize: '80px',
  footerSize: '50px',
  leftPanelSize: '250px'
};

const log = Log.create('layout material');


export interface MenuItem {
  name: string;
  href?: string;
  action?: (any) => void;
  leftMenu?: LeftMenuGroupItem[];
}

export interface LeftMenuGroupItem {
  name: string;
  description?: string;
  subitems: MenuItem[]
}

@Component({
  selector: 'layout-material',
  templateUrl: 'layout-material.component.html',
  styleUrls: ['layout-material.component.scss']
})

export class LayoutMaterialComponent implements AfterViewInit, OnInit, AfterContentInit {

  //#region top menu
  menu = {
    left: {
      items: []
    },
    top: {

      items: [
        {
          name: 'Administration',
          leftMenu: [
            {
              name: 'Setting',
              // description: 'General settings',
              subitems: [
                {
                  name: 'General'
                },
                {
                  name: 'Initialization '
                },
                {
                  name: 'Translations'
                }
              ]
            },
            {
              name: 'Users',
              // description: 'General settings',
              subitems: [
                {
                  name: 'Config'
                },
                {
                  name: 'List '
                }
              ]
            }
          ]
        },
        {
          name: 'Statistics',
          leftMenu: [
            {
              name: 'Payments',
              // description: 'General settings',
              subitems: [
                {
                  name: 'Config'
                },
                {
                  name: 'List '
                }
              ]
            },
            {
              name: 'Users',
              // description: 'General settings',
              subitems: [
                {
                  name: 'Config'
                },
                {
                  name: 'List '
                }
              ]
            },
            {
              name: 'Ad words',
              // description: 'General settings',
              subitems: [
                {
                  name: 'Config'
                },
                {
                  name: 'List '
                }
              ]
            }
          ]
        }
      ] as MenuItem[]
    }
  }
  //#endregion

  selectedTopMenu(index: number) {
    log.i('index', index)
    this.menu.left.items = this.menu.top.items[index].leftMenu;
  }

  elements = {
    content: {
      height: 0
    },
    leftPanel: {
      width: 0
    }
  }


  get calculate() {
    const self = this;
    return {
      get content() {
        return {
          height() {
            self.elements.content.height = window.innerHeight - numValue(variables.footerSize) - numValue(variables.headerSize)
            log.i('window.innerHeight', window.innerHeight)
            log.i('self.content.height ', self.elements.content.height)
          }
        }
      },
      get leftPanel() {
        return {
          width() {
            self.elements.leftPanel.width = numValue(variables.leftPanelSize)
          }
        };
      }
    };
  }

  recalculatElement() {
    this.calculate.content.height();
    this.calculate.leftPanel.width();
  }

  constructor() {
    log.i('variables', variables);
  }

  ngOnInit() {
    this.selectedTopMenu(0);
  }



  ngAfterViewInit() {
    setTimeout(() => {
      this.recalculatElement()
    });
  }

  ngAfterContentInit() {

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.recalculatElement();
  }


}
