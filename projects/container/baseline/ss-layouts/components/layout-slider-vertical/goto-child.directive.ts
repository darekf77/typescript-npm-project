

import { Directive, Input, OnInit, HostListener, ElementRef, AfterContentInit } from '@angular/core';


import { Log, Level } from 'ng2-logger';
import { SliderVerticalComponent } from './layout-slider-vertical.component';
const log = Log.create('go to vertival slider child', Level.__NOTHING);

@Directive({ selector: '[gotoChildVerticalSlider]' })
export class GoToChildVerticalSliderDirective implements AfterContentInit {
  constructor(private e: ElementRef) { }

  @Input() parent: SliderVerticalComponent;

  get element(): HTMLElement {
    return this.e.nativeElement ? this.e.nativeElement : undefined;
  }

  private childHeader: string;
  @Input() set gotoChildVerticalSlider(childHeader: string) {
    log.i('go to', childHeader);
    this.childHeader = childHeader;
  }

  ngAfterContentInit() {
    if (!this.parent) {
      setTimeout(() => {
        const parent = SliderVerticalComponent.instances.find(p => {
          const child = p.getChildBy(this.childHeader);
          return !!child;
        });
        this.parent = parent;
        log.i('founded parent in search', this.parent);
      });
    }
  }



  @HostListener('click')
  click() {
    log.i('goto', this.childHeader);
    log.i('this.parent', this.parent);
    if (this.parent) {
      this.parent.goTo(this.parent.getChildBy(this.childHeader));
    } else {
      log.error('no parent element for directive gotoChildVerticalSlider="" ');
    }
  }

}
