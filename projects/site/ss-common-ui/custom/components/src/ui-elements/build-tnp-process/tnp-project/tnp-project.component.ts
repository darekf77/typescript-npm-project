import { Component, OnInit, Input } from '@angular/core';

import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { EnvironmentName } from 'tnp-bundle/browser';

@Component({
  selector: 'app-tnp-project',
  templateUrl: './tnp-project.component.html',
  styleUrls: ['./tnp-project.component.scss']
})
export class TnpProjectComponent implements OnInit {

  constructor() { }


  @Input() expanded = false;

  @Input() isChild = false;

  @Input() model: TNP_PROJECT;

  ngOnInit() {
    // this.model.children
  }

}
