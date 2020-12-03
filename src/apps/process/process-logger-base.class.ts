import { BaseFormlyComponent } from 'tnp-helpers';
import { Input, HostBinding, Component, AfterViewInit, ElementRef } from '@angular/core';

@Component({
  selector: 'process-logger-base',
  template: ''
})
export abstract class ProcessLoggerBaseClass extends BaseFormlyComponent implements AfterViewInit {

  constructor(
    protected elemetRef: ElementRef) {
    super();
  }
  // @Input() @HostBinding('style.height.px') height = 190;

  ngAfterViewInit() {
    // this.messages = this.model.allProgressData;
    setTimeout(() => {
      // this.elemetRef.nativeElement.style.height = `${this.height}px`;
      this.scrollDown();
    });
  }

  public scrollDown() {
    setTimeout(() => {
      if (this.elemetRef && this.elemetRef.nativeElement) {
        this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
      }
    }, 100);
  }

}
