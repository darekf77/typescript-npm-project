import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-log-prcess',
  templateUrl: './log-prcess.component.html',
  styleUrls: ['./log-prcess.component.scss']
})
export class LogPrcessComponent implements OnInit {

  @Input() content: string;

  change(e: MatSlideToggleChange) {
    this.realtime.emit(e.checked);
  }

  @Output() realtime = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
    this.realtime.emit(false);
  }

}
