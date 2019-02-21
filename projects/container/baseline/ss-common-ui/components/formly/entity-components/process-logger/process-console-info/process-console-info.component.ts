import * as _ from 'lodash';
import { EventEmitter, Component, OnInit, Input, Output, OnChanges, ElementRef } from '@angular/core';
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseComponent } from '../../../../helpers/base-component';

@Component({
  selector: 'app-process-console-info',
  templateUrl: './process-console-info.component.html',
  styleUrls: ['./process-console-info.component.scss']
})
export class ProcessConsoleInfoComponent extends BaseComponent implements OnInit {


  @Input() public changes: BehaviorSubject<void>;
  @Input() public outputType: 'stdout' | 'stder' = 'stdout'
  @Input() public model: PROCESS;

  ngAfterViewInit() {
    this.scrollDown()
  }

  constructor(private elemetRef: ElementRef) {
    super()
  }

  scrollDown() {
    if (this.elemetRef && this.elemetRef.nativeElement) {
      this.elemetRef.nativeElement.scrollTop = this.elemetRef.nativeElement.scrollHeight;
    }
  }


  ngOnInit() {
    this.handlers.push(this.changes.subscribe(() => {
      // console.log(`CHANGES PROCESS CONSOLE: ${this.outputType}`)
      this.scrollDown()
    }))
  }

}
