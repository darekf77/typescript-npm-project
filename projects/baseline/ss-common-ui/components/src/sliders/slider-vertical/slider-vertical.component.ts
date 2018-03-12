
import {
  Component, OnInit, HostBinding, AfterViewInit,
  HostListener, Input, ElementRef, ViewChild
} from '@angular/core';

import { Log, Level } from 'ng2-logger';


const log = Log.create('slider vertical layout');



@Component({
  selector: 'slider-vertical',
  templateUrl: 'slider-vertical.component.html',
  styleUrls: ['slider-vertical.component.scss']
})

export class SliderVerticalComponent implements AfterViewInit, OnInit {

  @ViewChild('wrapper') __wrapper: ElementRef;
  @ViewChild('header') __header: ElementRef;
  @Input() thresholdScroll = 0;
  wrapperHeight = 0;
  wrapperPaddingTop = 0;
  get wrapper(): HTMLElement {
    return this.__wrapper ? this.__wrapper.nativeElement : undefined;
  }
  get header(): HTMLElement {
    return this.__header ? this.__header.nativeElement : undefined;
  }

  is = {
    scroll: false,
    afterViewInit: false
  };

  constructor() {

  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.is.afterViewInit = true;
    this.calculateHeight();
    log.i('after view init!');
  }



  public onMouseWheelFirefox(e: MouseEvent) {
    const delta = parseInt(e['wheelDelta'] || -e.detail, undefined);
    this.onMouseWheel(e as any, delta);
  }

  public onMouseWheel(e: WheelEvent, delta: number) {
    e.preventDefault();
    if (!delta) { delta = e.deltaY; }
    const prev = this.is.scroll;
    this.is.scroll = (this.wrapper.scrollTop > this.thresholdScroll);
    log.i('delta', delta);
    if (prev !== this.is.scroll) { this.calculateHeight(); }
    if (this.wrapper.scrollTop + delta < 0) {
      this.wrapper.scrollTop = 0;
    } else {
      this.wrapper.scrollTop += delta;
    }
  }




  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (!this.is.afterViewInit) { return; }
    this.calculateHeight();
  }


  calculateHeight() {
    setTimeout(() => {
      const target = this.header.firstElementChild;
      if (!target) {
        log.er('no target!s');
        return;
      }
      const header = window.getComputedStyle(target, null);
      log.i('header', header.height);
      const wrapperPaddingTop = parseInt(header.height.replace('px', ''));
      log.i('wrapperPaddingTop', wrapperPaddingTop);
      const wrapperHeight = (document.body.clientHeight);
      log.i('wrapperHeight', wrapperHeight);


      this.wrapperPaddingTop = wrapperPaddingTop;
      // this.wrapperHeight = wrapperHeight;
      // $(this.elem).slimScroll({
      //     height: `${this.height - heightMinus}px`
      // });
    }, 2000);
  }


}
