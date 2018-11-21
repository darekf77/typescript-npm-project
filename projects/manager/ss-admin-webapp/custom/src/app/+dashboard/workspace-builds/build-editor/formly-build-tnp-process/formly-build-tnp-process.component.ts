import { Component, OnInit } from '@angular/core';
import { FieldType, ConfigOption } from '@ngx-formly/core';
import { TypeOption } from '@ngx-formly/core/src/services/formly.config';
import { BUILD } from 'ss-common-logic/browser/entities/BUILD';


@Component({
  selector: 'app-formly-build-tnp-process',
  templateUrl: './formly-build-tnp-process.component.html',
  styleUrls: ['./formly-build-tnp-process.component.scss']
})
export class FormlyBuildTnpProcessComponent extends FieldType implements OnInit {

  public static readonly typeName =  'formly-build-tnp-process';
  public static get type(): TypeOption {
    return {
      component: FormlyBuildTnpProcessComponent,
      name: this.typeName

    }
  }



  model: BUILD;

  ngOnInit() {
  }

}
