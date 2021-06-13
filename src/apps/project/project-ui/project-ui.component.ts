//#region angular
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
//#endregion
//#region isomorphic
import { Morphi } from 'morphi';
import { PROJECT } from '../PROJECT';
import { BaseFormlyComponent, DualComponentController } from 'tnp-helpers';
//#endregion

export class DualComponentControllerExtended extends DualComponentController { }

@Morphi.Formly.RegisterComponentForEntity(PROJECT)
@Component({
  selector: 'app-project-ui',
  templateUrl: './project-ui.component.html',
  styleUrls: ['./project-ui.component.scss']
})
export class BuildTnpProcessComponent extends BaseFormlyComponent {

  DualComponentController = DualComponentControllerExtended;
  // @ts-ignore
  @Input() model: PROJECT;

  isLinear = false;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;

  ngOnInit() {
    // this.firstFormGroup = this._formBuilder.group({
    //   firstCtrl: ['', Validators.required]
    // });
    // this.secondFormGroup = this._formBuilder.group({
    //   secondCtrl: ['', Validators.required]
    // });
  }


}
