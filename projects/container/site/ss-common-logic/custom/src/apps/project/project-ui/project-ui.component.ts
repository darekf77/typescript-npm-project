import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PROJECT } from '../PROJECT';

// import { ProjectController } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/ProjectController';
// import { ProcessController } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/ProcessController';


@Component({
  selector: 'app-project-ui',
  templateUrl: './project-ui.component.html',
  styleUrls: ['./project-ui.component.scss']
})
export class BuildTnpProcessComponent implements OnInit {


  @Input() model: PROJECT;

  isLinear = false;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    // private porjectController: ProjectController,
    // private processController: ProcessController
    ) { }

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required]
    });
  }


}
