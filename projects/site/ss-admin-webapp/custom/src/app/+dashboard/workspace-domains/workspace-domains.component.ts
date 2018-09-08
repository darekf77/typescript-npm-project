import { Component, OnInit } from '@angular/core';
import DomainsController from 'ss-common-logic/browser/controllers/DomainsController';

@Component({
  selector: 'app-workspace-domains',
  templateUrl: './workspace-domains.component.html',
  styleUrls: ['./workspace-domains.component.scss']
})
export class WorkspaceDomainsComponent implements OnInit {

  constructor(domainsController: DomainsController) {

  }

  ngOnInit() {
  }

}
