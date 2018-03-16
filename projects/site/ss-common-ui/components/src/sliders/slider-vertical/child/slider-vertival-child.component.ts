

import { Component, OnInit, Input, HostBinding, AfterContentInit, ElementRef } from '@angular/core';

import { Log, Level } from 'ng2-logger';
import { SliderVerticalComponent } from '../slider-vertical.component';
const log = Log.create('slider vertical child', Level.__NOTHING)

@Component({
  selector: 'slider-vertical-child',
  templateUrl: 'slider-vertival-child.component.html',
  styleUrls: ['slider-vertival-child.component.scss']
})

export class SliderVertivalChildComponent implements OnInit {

  @Input() header: string;
  @Input() parent: SliderVerticalComponent;

  constructor(private e: ElementRef) { }

  height: number;

  ngOnInit() {
    if (!this.header) {
      log.error(`required header for input <slider-vertical-child header="..." `)
    }
  }

  ngAfterContentInit() {
    const sliderStyles = window.getComputedStyle(this.e.nativeElement);
    this.height = parseInt(sliderStyles.height.replace('px', ''), 10);
  }
}
