
import {
  Component, OnInit, HostBinding, AfterViewInit, AfterContentInit,
  HostListener, Input, ElementRef, ViewChild, ContentChildren, QueryList
} from '@angular/core';

import { Log, Level } from 'ng2-logger';


const log = Log.create('layout material');



@Component({
  selector: 'layout-material',
  templateUrl: 'layout-material.component.html',
  styleUrls: ['layout-material.component.scss']
})

export class LayoutMaterialComponent implements AfterViewInit, OnInit, AfterContentInit {

  constructor() {

  }

  ngOnInit() {

  }

  ngAfterViewInit() {

  }

  ngAfterContentInit() {

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {

  }


}
