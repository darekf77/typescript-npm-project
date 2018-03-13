

import { Directive, Input, HostListener } from '@angular/core';


import { Log, Level } from 'ng2-logger';
import { SliderVerticalComponent } from './slider-vertical.component';
const log = Log.create('go to vertival slider child')

@Directive({ selector: '[gotoChildVerticalSlider]' })
export class GoToChildVerticalSliderDirective {
  constructor() { }


  private childHeader: string
  @Input() set gotoChildVerticalSlider(childHeader: string) {
    log.i('go to', childHeader)
    this.childHeader = childHeader;
  }

  @Input() parent: SliderVerticalComponent;

  @HostListener('click')
  click() {
    log.i('goto', this.childHeader)
    log.i('goto', this)
    this.parent.goTo(this.parent.getChildBy(this.childHeader))
  }

}
