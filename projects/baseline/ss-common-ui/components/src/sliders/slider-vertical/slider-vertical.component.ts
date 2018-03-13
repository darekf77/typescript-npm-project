
import {
  Component, OnInit, HostBinding, AfterViewInit,
  HostListener, Input, ElementRef, ViewChild
} from '@angular/core';

import { Log, Level } from 'ng2-logger';
import { ISlimScrollOptions } from 'ngx-slimscroll';


const log = Log.create('slider vertical layout');



@Component({
  selector: 'slider-vertical',
  templateUrl: 'slider-vertical.component.html',
  styleUrls: ['slider-vertical.component.scss']
})

export class SliderVerticalComponent implements AfterViewInit, OnInit {

  @ViewChild('wrapper') __wrapper: ElementRef;
  @ViewChild('header') __header: ElementRef;
  @ViewChild('slider') __slider: ElementRef;
  get slider(): HTMLElement {
    return this.__wrapper ? this.wrapper.firstElementChild as any : undefined;
  }
  get header(): HTMLElement {
    return this.__header ? this.__header.nativeElement : undefined;
  }
  get wrapper(): HTMLElement {
    return this.__wrapper ? this.__wrapper.nativeElement : undefined;
  }
  @Input() thresholdScroll = 0;


  css = {
    wrapper: {
      height: 0,
      paddingTop: 0,
      scrollTop: 0
    }
  };

  get computed() {
    const slef = this;
    return {
      css: {
        slider: {
          get height() {
            const sliderStyles = window.getComputedStyle(slef.slider);
            return parseInt(sliderStyles.height.replace('px', ''), 10);
          }
        }
      }
    };
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
    log.i('fiefox scroll');
    let rolled = 0;
    if ('wheelDelta' in e) {
      rolled = e['wheelDelta'];
    } else {  // Firefox
      // The measurement units of the detail and wheelDelta properties are different.
      rolled = -40 * e.detail;
    }
    this.onMouseWheel(e as any, -rolled);
  }

  public onMouseWheel(e: WheelEvent, delta: number) {
    e.preventDefault();
    if (!delta) {
      log.i('chrome scroll');
      delta = e.deltaY;
    }
    const prevIsScroll = this.is.scroll;
    this.is.scroll = (this.css.wrapper.scrollTop > this.thresholdScroll);
    log.i('delta', delta);

    if (prevIsScroll !== this.is.scroll) {
      this.calculateHeight();
    }

    if (this.css.wrapper.scrollTop + delta < 0) {
      this.css.wrapper.scrollTop = 0;
    } else {
      log.i('this.computed.css.slider.height', this.computed.css.slider.height);
      if ((this.css.wrapper.scrollTop + delta) >= this.computed.css.slider.height) {
        this.css.wrapper.scrollTop = this.computed.css.slider.height;
      } else {
        this.css.wrapper.scrollTop = this.css.wrapper.scrollTop + delta;
      }
    }

    log.i('this.css.wrapper.scrollTop', this.css.wrapper.scrollTop);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (!this.is.afterViewInit) { return; }
    this.calculateHeight();
  }


  calculateHeight() {
    setTimeout(() => {
      const header = this.header;
      if (!header) {
        log.er('no header element !');
        return;
      }
      const headerStyles = window.getComputedStyle(header);
      log.i('slider height', headerStyles.height);
      this.css.wrapper.paddingTop = parseInt(headerStyles.height.replace('px', ''), 10);
      const windowHeight = window.innerHeight;
      log.i('windowHeight', windowHeight);
      this.css.wrapper.height = windowHeight - this.css.wrapper.paddingTop;
      log.i('css.wrapper.height', this.css.wrapper.height);
    });
  }


}
