import { Component, OnInit, Input } from '@angular/core';
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';

@Component({
  selector: 'app-process-console-info',
  templateUrl: './process-console-info.component.html',
  styleUrls: ['./process-console-info.component.scss']
})
export class ProcessConsoleInfoComponent implements OnInit {

  @Input() public outputType: 'stdout' | 'stder' = 'stdout'
  @Input() public model: PROCESS;

  constructor() { }

  ngOnInit() {

  }

}
