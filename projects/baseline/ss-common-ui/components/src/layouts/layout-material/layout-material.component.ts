
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

import * as vars from '!sass-variable-loader!./variables.scss'
const variables: LayoutMaterialVariables = vars as any;

const log = Log.create('layout material');



@Component({
  selector: 'layout-material',
  templateUrl: 'layout-material.component.html',
  styleUrls: ['layout-material.component.scss']
})

export class LayoutMaterialComponent implements AfterViewInit, OnInit, AfterContentInit {

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
        }
      }
    }
  }

  recalculatElement() {
    this.calculate.content.height()
    this.calculate.leftPanel.width()
  }

  constructor() {
    log.i('variables', variables)
  }

  ngOnInit() {

  }



  ngAfterViewInit() {
    setTimeout(() => {
      this.recalculatElement()
    })
  }

  ngAfterContentInit() {

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.recalculatElement()
  }


}
