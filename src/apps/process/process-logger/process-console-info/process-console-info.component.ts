import { _ } from 'tnp-core';
import {
  EventEmitter, Component, OnInit, Input,
  Output, OnChanges, ElementRef, AfterViewInit, HostBinding, OnDestroy, ChangeDetectorRef
} from '@angular/core';
import { PROCESS } from '../../PROCESS';
import { BehaviorSubject } from 'rxjs';
import {
  BaseFormlyComponent, DualComponentController,
  ResizeService, BaseComponent
} from 'tnp-helpers';

import { Log } from 'ng2-logger';
import { ProcessLoggerBaseClass } from '../../process-logger-base.class';
const log = Log.create('process console info');

@Component({
  selector: 'app-process-console-info',
  templateUrl: './process-console-info.component.html',
  styleUrls: ['./process-console-info.component.scss']
})
export class ProcessConsoleInfoComponent extends ProcessLoggerBaseClass
  implements OnInit, AfterViewInit, OnDestroy {


  @Input() public changes: BehaviorSubject<void>;
  @Input() public outputType: 'stdout' | 'stder' = 'stdout';
  // @ts-ignore
  @Input() public model: PROCESS;

  get process() {
    return this.model;
  }



  public resizeService: ResizeService = new ResizeService();
  constructor(
    elemetRef: ElementRef,
    private changeDetectionRef: ChangeDetectorRef,
  ) {
    super(elemetRef);
  }


  scrollDown() {
    setTimeout(() => {
      if (this.elemetRef && this.elemetRef.nativeElement) {
        this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
      }
    }, 100);
  }

  clear(consoleContent: string) {
    return consoleContent.replace(/(?:\r\n|\r|\n)/g, '<br>');
  }

  ngOnInit() {

    this.handlers.push(this.changes.subscribe(() => {
      // console.log('CHANGES PROCESS INFO')
      this.scrollDown();
    }) as any);


    // console.log(`SUBSCRIBE PROPTERY: ${this.process.id} - ${this.outputType} `);

    this.process.subscribeRealtimeUpdates({
      property: this.outputType,
      bufforProperty: `_${this.outputType}` as any,
      callback: () => {
        // log.d(`callback, outputType: "${this.outputType}"`)
        this.changes.next(void 0);
        this.changeDetectionRef.detectChanges();
      }
    });


  }


  ngAfterViewInit() {

    // const savedHeight = Number(localStorage.getItem(this.lsKey));
    // console.log('from local storage height', savedHeight)
    setTimeout(() => {
      // this.elemetRef.nativeElement.style.height = `${this.height}px`;
      this.scrollDown();
    });
  }
  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
    this.resizeService.removeResizeEventListener(this.elemetRef.nativeElement);
    if (this.model instanceof PROCESS) {
      this.process.unsubscribeRealtimeUpdates(this.outputType);
    }
  }

}
