// angular
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
// material
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// formly
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
// other
import * as _ from 'lodash';
import { Morphi, ModelDataConfig } from 'morphi/browser';
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('form warpper material component');

@Component({
  selector: 'app-form-wrapper-material',
  templateUrl: './form-wrapper-material.component.html',
  styleUrls: ['./form-wrapper-material.component.scss']
})
export class FormWrapperMaterialComponent implements OnInit {

  @Input() modelDataConfig = new Morphi.CRUD.ModelDataConfig();
  @ViewChild('templateDelete') templateDelete: TemplateRef<any>;

  constructor(
    private dialog: MatDialog
  ) { }

  formly = {
    form: (undefined) as FormGroup,
    options: undefined as FormlyFormOptions,
    fields: undefined as FormlyFieldConfig[]
  };

  id_toDelete: number;
  @Input() id: number;

  /**
   * Exclude specyfic generated form fields
   */
  @Input() exclude: string[] = [];

  @Input() fieldsOrder: string[];

  @Input() mode: 'update' | 'create' = 'update';

  @Input() crud: Morphi.CRUD.Base<any>;

  @Input() form = new FormGroup({});
  @Input() formGroup: FormGroup;
  @Input() model = {};
  @Input() showButtons = true;
  @Input() options: FormlyFormOptions = {};
  @Input() fields: FormlyFieldConfig[] = [];
  private backupModel = {};

  @Output() submit = new EventEmitter();

  @Output() complete = new EventEmitter();

  @Input() entity: Function;

  dialogRefDelete: MatDialogRef<any>;

  waringAboutDecorator() {
    console.error(`

    Please use:
    @FormlyForm()
    @DefaultModelWithMapping(...)

    decorators for entity "${this.entity && _.trim(this.entity.name)}"

    `);
  }

  resolveFields() {
    let fields = Morphi.CRUD.getFormlyFrom(this.entity);
    log.i(`fields from entity : ${this.entity && this.entity.name}`, fields);

    if (_.isFunction(this.entity) && !fields) {
      this.waringAboutDecorator();
    }

    if (_.isArray(this.fields)) {
      log.i('field from input', this.fields);

      if (_.isArray(fields)) {
        const keys = fields.map(c => c.key);

        fields = fields.map(field => {
          return _.merge(field, this.fields.find(f => f.key === field.key));
        });
        fields = fields
          .concat(this.fields.filter(field => !keys.includes(field.key)));
        log.i('field affer contact', fields);
      }

    }
    if (!_.isArray(fields)) {
      fields = this.fields;
    }

    fields = fields.filter(({ key }) => !(key && this.exclude.includes(key)));
    log.i('fields filter', fields);

    this.formly.fields = fields;
    log.i('FORMLY FIELDS', this.formly.fields);
  }

  async ngOnInit() {
    log.i(`CRUD`, this.crud);
    if (!this.entity && this.crud && this.crud.entity) {
      this.entity = this.crud.entity;
    }
    this.resolveFields();

    this.formly.options = this.options;
    this.formly.form = this.formGroup ? this.formGroup : this.form;
    this.setModel(this.model);


    if ((!_.isUndefined(this.id))) {
      const m = await this.crud.getBy(this.id, this.modelDataConfig).received;
      this.setModel(m.body.json);
    }

    this.createOrder();
  }

  createOrder() {

    if (!this.fieldsOrder) {
      this.fieldsOrder = [];
    }
    if (_.isString(this.fieldsOrder)) {
      this.fieldsOrder = this.fieldsOrder.split(',');
    }
    log.i('create order!', this.fieldsOrder);
    const fieldsNewOrder = [];

    if (this.fieldsOrder.length > 0) {
      this.fieldsOrder.forEach(orderKey => {
        const f = this.formly.fields.find(({ key, id }) => (key === orderKey || id === orderKey));
        if (f) {
          fieldsNewOrder.push(f);
        }
      });
      this.formly.fields = fieldsNewOrder.concat(this.formly.fields.filter(f => !fieldsNewOrder.includes(f)));
      log.i('new Order', this.formly.fields.map(f => f.key).join(','));
    }
  }

  setModel(model) {
    this.model = model;
    this.backupModel = _.cloneDeep(this.model);
  }

  async ngSubmit(model) {

    const { id } = model;
    let resultModel = model;
    log.i('submit model', model);

    if (this.crud) {
      if (this.mode === 'update') {
        try {
          const m = await this.crud.updateById(id, model, this.modelDataConfig).received;
          log.i('Model update success', m);
          resultModel = m.body.json;
          this.submit.next(model);
        } catch (e) {
          log.er('Model update error', e);
          this.submit.error(e);
        }
      } else if (this.mode === 'create') {
        try {
          const m = await this.crud.create(model, this.modelDataConfig).received;
          log.i('Model create success', m);
          resultModel = m.body.json;
          this.submit.next(model);
        } catch (e) {
          log.er('Model create error', e);
          this.submit.error(e);
        }
      }

    } else if (this.crud) {
      this.submit.next(model);
    }
    this.complete.next(resultModel);
  }

  async delete(id) {
    await this.crud.deleteById(id).received;
  }
  openDeleteDialog(id) {
    log.i('openDeleteDialog to delete id: ', id);
    this.id_toDelete = id;
    this.dialogRefDelete = this.dialog.open(this.templateDelete);
    this.dialogRefDelete.afterClosed().subscribe((result) => {
      log.i(`dialog result: ${result} `);
      if (result) {
        this.complete.next();
      }
    });
  }

  onNoClick(): void {
    this.dialogRefDelete.close();
  }

  clear() {
    this.model = this.backupModel;
    this.backupModel = _.cloneDeep(this.model);
  }

}
