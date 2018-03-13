
import {
  Component, OnInit, HostBinding, AfterViewInit, AfterContentInit,
  HostListener, Input, ElementRef, ViewChild, ContentChildren, QueryList
} from '@angular/core';

import { Log, Level } from 'ng2-logger';
import { SliderVertivalChildComponent } from './child/slider-vertival-child.component';


const log = Log.create('slider vertical layout', Level.__NOTHING);



@Component({
  selector: 'slider-vertical',
  templateUrl: 'slider-vertical.component.html',
  styleUrls: ['slider-vertical.component.scss']
})

export class SliderVerticalComponent implements AfterViewInit, OnInit {

  public static instances: SliderVerticalComponent[] = [];

  @ContentChildren(SliderVertivalChildComponent) contentChildren: QueryList<SliderVertivalChildComponent>;

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

  inSmoothScroll(fn: () => void) {
    this.css.wrapper.scrollBehavior = 'smooth'
    setTimeout(() => {
      fn()
      setTimeout(() => {
        this.css.wrapper.scrollBehavior = undefined
      });
    })
  }


  css = {
    wrapper: {
      height: 0,
      paddingTop: 0,
      scrollTop: 0,
      scrollBehavior: undefined as 'smooth'
    }
  };

  get computed() {
    const self = this;
    return {
      css: {
        slider: {
          get height() {
            const sliderStyles = window.getComputedStyle(self.slider);
            return parseInt(sliderStyles.height.replace('px', ''), 10);
          },
          get maxScrollTop() {
            // log.d('slider.scrollHeight ', self.slider.scrollHeight)
            // log.d('slider.clientTop ', self.slider.clientTop)
            const max = self.computed.css.slider.height - self.css.wrapper.height;
            return (max < 0) ? 0 : max;
          }
        },
        header: {
          get marginTop() {
            return (self.is.scroll ? self.css.wrapper.paddingTop : 0);
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
    if (!SliderVerticalComponent.instances.find(d => d === this)) {
      SliderVerticalComponent.instances.push(this)
    }
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.is.afterViewInit = true;
    this.calculateHeight();
    log.i('after view init!');
  }

  ngAfterContentInit() {
    log.i('childrens', this.contentChildren)
    if (this.contentChildren) {
      this.contentChildren.forEach(c => c.parent = this)
    }
  }

  private updateScrollPos(position: number) {
    this.css.wrapper.scrollTop = position;

    const prevIsScroll = this.is.scroll;
    this.is.scroll = (this.css.wrapper.scrollTop > this.thresholdScroll);
    if (prevIsScroll !== this.is.scroll) {
      this.calculateHeight();
      this.css.wrapper.scrollTop = position;
    }

  }

  setScroll(position: number, smooth = false) {
    log.i('maxScrollTop', this.computed.css.slider.maxScrollTop)
    if (position > this.computed.css.slider.maxScrollTop) position = this.computed.css.slider.maxScrollTop;
    if (smooth) {
      this.inSmoothScroll(() => {
        this.updateScrollPos(position)
      })
    } else {
      this.updateScrollPos(position)
    }

  }

  public onMouseWheelFirefox(e: MouseEvent) {
    log.d('fiefox scroll');
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
      log.d('chrome scroll');
      delta = e.deltaY;
    }
    log.d('delta', delta);

    if (this.css.wrapper.scrollTop + delta < 0) {
      this.setScroll(0);
    } else {
      log.d('this.computed.css.slider.height', this.computed.css.slider.height);
      if ((this.css.wrapper.scrollTop + delta) >= this.computed.css.slider.height) {
        this.setScroll(this.computed.css.slider.height)
      } else {
        this.setScroll(this.css.wrapper.scrollTop + delta)
      }
    }

    log.d('this.css.wrapper.scrollTop', this.css.wrapper.scrollTop);
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
      const headerStyles = window.getComputedStyle(header.firstElementChild);
      this.css.wrapper.paddingTop = parseInt(headerStyles.height.replace('px', ''), 10);
      log.i('slider height', headerStyles.height);
      const windowHeight = window.innerHeight;
      log.i('windowHeight', windowHeight);
      this.css.wrapper.height = windowHeight - this.css.wrapper.paddingTop;
      log.i('css.wrapper.height', this.css.wrapper.height);
    });
  }

  getChildBy(header: string) {
    if (this.contentChildren) {
      return this.contentChildren.find(c => c.header === header)
    }
  }

  goTo(child: SliderVertivalChildComponent) {
    if (!child) {
      log.er('not child to go')
      return;
    }
    setTimeout(() => {
      log.i('go to child', child)
      if (this.contentChildren) {
        let height = 0;
        this.contentChildren.forEach(c => {
          if (c === child) {
            this.setScroll(height, true)
            log.i('goto height', height)
            return;
          } else {
            log.i('child.height', child.height)
            height += child.height;
          }
        })
      }
    })

  }


}
