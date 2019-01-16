import { Component, OnInit } from '@angular/core';
// formly
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'app-dialog-field',
  templateUrl: './dialog-field.component.html',
  styleUrls: ['./dialog-field.component.scss']
})
export class DialogFieldComponent extends FieldType implements OnInit {

  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
  }

}
