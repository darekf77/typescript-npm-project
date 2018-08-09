// angular
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
// formly
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { BaseCRUD, Describer } from 'morphi/browser';
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
    options: undefined as FormlyFormOptions,
    fields: undefined as FormlyFieldConfig[]
  };
  @Input() crud: BaseCRUD<any>;

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
    if (!this.entity && this.crud && this.crud.entity) {
      this.entity = this.crud.entity;
    }

    const fields = getFormlyFrom(this.entity);
    log.i(`fields from : ${this.entity && this.entity.name}`, fields);
    if (!fields) {
      console.error(`

      Please use:
      @FormlyForm()
      @DefaultModelWithMapping(...)

      decorators for entity "${this.entity && _.trim(this.entity.name)}"

      `);
    } else {
      log.i('input fields', this.fields);
      const keys = fields.map(c => c.key);

      if (_.isArray(this.fields)) {

        this.formly.fields = fields.map(field => {
          return _.merge(field, this.fields.find(f => f.key === field.key));
        });
        this.formly.fields = this.formly.fields.concat(this.fields.filter(field => !keys.includes(field.key)));

      } else {
        this.formly.fields = fields;
      }
      log.i('formly config from class example', this.formly.fields);

      this.formly.options = this.options;
      this.formly.form = this.form;
      this.backupModel = _.cloneDeep(this.model);
    }

  }

  async ngSubmit(model) {
    const { id } = model;
    log.i('submit model', model);

    if (this.crud) {
      try {
        const m = await this.crud.updateById(id, model);
        log.i('Model update success', m);
      } catch (e) {
        log.er('Model update error', e);
      }
    } else if (this.crud) {
      this.submit.next(model);
    }
  }



  clear() {
    this.model = this.backupModel;
    this.backupModel = _.cloneDeep(this.model);
  }

}
