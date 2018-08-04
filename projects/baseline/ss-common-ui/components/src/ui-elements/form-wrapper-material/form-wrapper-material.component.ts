import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { getFormlyFrom } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';

const log = Log.create('form warpper material component');

@Component({
  selector: 'app-form-wrapper-material',
  templateUrl: './form-wrapper-material.component.html',
  styleUrls: ['./form-wrapper-material.component.scss']
})
export class FormWrapperMaterialComponent implements OnInit {

  formly = {
    form: (undefined) as FormGroup,
    model: undefined,
    options: undefined as FormlyFormOptions,
    fields: undefined as FormlyFieldConfig[]
  };

  @Input() form = new FormGroup({});
  @Input() model: any = {
    name: 'Dariusz',
    href: 'asdasd',
    isAmazing: true
  };
  @Input() options: FormlyFormOptions = {};
  @Input() fields: FormlyFieldConfig[] = [];
  private backupModel = {};

  @Output() submit = new EventEmitter();

  constructor() { }

  @Input() entity: Function;

  ngOnInit() {
    const fields = getFormlyFrom(this.entity);
    log.i('input fields', this.fields);

    if (_.isArray(this.fields)) {
      this.formly.fields = fields.map(field => {
        return _.merge(field, this.fields.find(f => f.key === field.key));
      });
    } else {
      this.formly.fields = fields;
    }
    log.i('formly config from class example', this.formly.fields);

    this.formly.options = this.options;
    this.formly.form = this.form;
    this.formly.model = this.model;
    this.backupModel = _.cloneDeep(this.formly.model);
  }

  ngSubmit(model) {
    log.i('submit model', model);
    this.submit.next(model);
  }



  clear() {
    this.formly.model = this.backupModel;
    this.backupModel = _.cloneDeep(this.formly.model);
  }

}
