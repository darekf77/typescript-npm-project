import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/PROJECT';

// import { ProjectController } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/ProjectController';
// import { ProcessController } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/ProcessController';


@Component({
  selector: 'app-build-tnp-process',
  templateUrl: './build-tnp-process.component.html',
  styleUrls: ['./build-tnp-process.component.scss']
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
