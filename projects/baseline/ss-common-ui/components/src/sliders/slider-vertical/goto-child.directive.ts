

import { Directive, Input, OnInit, HostListener, ElementRef, AfterContentInit } from '@angular/core';


import { Log, Level } from 'ng2-logger';
import { SliderVerticalComponent } from './slider-vertical.component';
const log = Log.create('go to vertival slider child', Level.__NOTHING)

@Directive({ selector: '[gotoChildVerticalSlider]' })
export class GoToChildVerticalSliderDirective implements AfterContentInit {
  constructor(private e: ElementRef) { }

  get element(): HTMLElement {
    return this.e.nativeElement ? this.e.nativeElement : undefined;
  }

  private childHeader: string
  @Input() set gotoChildVerticalSlider(childHeader: string) {
    log.i('go to', childHeader)
    this.childHeader = childHeader;
  }

  ngAfterContentInit() {
    // if (!this.parent) {
    //   this.parent = this.findParent(this.element);
    // }
  }

  @Input() parent: SliderVerticalComponent;

  @HostListener('click')
  click() {
    log.i('goto', this.childHeader)
    log.i('this.parent', this.parent)
    if (this.parent) {
      this.parent.goTo(this.parent.getChildBy(this.childHeader))
    } else {
      log.error('no parent element for directive gotoChildVerticalSlider="" ')
    }
  }

  findParent(elem: HTMLElement): SliderVerticalComponent {

    if (!elem) return;;
    if (elem instanceof SliderVerticalComponent) {
      log.i('parent founded!')
      return elem;
    }
    log.d('elem search parent', elem.parentNode)
    return this.findParent(elem.parentElement);
  }


}
