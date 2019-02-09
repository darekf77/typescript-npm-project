import { Morphi } from 'morphi/browser';
import { Component, OnInit } from '@angular/core';

// formly
import { FieldType } from '@ngx-formly/core';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Morphi.Formly.RegisterComponentAsType('ProcessLoggerComponent')
@Component({
  selector: 'app-process-logger',
  templateUrl: './process-logger.component.html',
  styleUrls: ['./process-logger.component.scss']
})
export class ProcessLoggerComponent extends FieldType implements OnInit {

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
