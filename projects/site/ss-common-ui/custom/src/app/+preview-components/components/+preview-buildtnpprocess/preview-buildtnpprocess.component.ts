import { Component, OnInit } from '@angular/core';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';
import { TNP_PROJECT } from 'ss-common-logic/browser/entities/TNP_PROJECT';
import { BuildService } from 'ss-common-logic/browser/services/BuildService';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-preview-buildtnpprocess',
  templateUrl: './preview-buildtnpprocess.component.html',
  styleUrls: ['./preview-buildtnpprocess.component.scss']
})
export class PreviewBuildtnpprocessComponent implements OnInit {


  constructor(private buildService: BuildService) { }

  model$: Observable<BUILD>;

  ngOnInit() {

    this.model$ = this.buildService.$observe.byId(1, undefined);

  }

}
