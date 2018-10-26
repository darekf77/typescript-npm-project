import { Component, OnInit } from '@angular/core';
import { FieldType, ConfigOption } from '@ngx-formly/core';
import { TypeOption } from '@ngx-formly/core/src/services/formly.config';


@Component({
  selector: 'app-formly-build-tnp-process',
  templateUrl: './formly-build-tnp-process.component.html',
  styleUrls: ['./formly-build-tnp-process.component.scss']
})
export class FormlyBuildTnpProcessComponent extends FieldType implements OnInit {

  public static get type(): TypeOption {
    return {
      component: FormlyBuildTnpProcessComponent,
      name: 'formly-build-tnp-process',

    }
  }


  ngOnInit() {
  }

}
