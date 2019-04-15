import { Component, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { BaseComponent } from '../../../helpers/base-component';

@Component({
  selector: 'app-cmp-example',
  templateUrl: './cmp-example.component.html',
  styleUrls: ['./cmp-example.component.scss']
})
export class CmpExampleComponent extends BaseComponent implements OnInit {

  constructor() {
    super()
  }

  ngOnInit() {
  }

}
