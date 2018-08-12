// angular
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
// material
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
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
  @Input() mode: 'update' | 'create' = 'update';

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

  @Output() complete = new EventEmitter();

  @Input() entity: Function;

  dialogRefDelete: MatDialogRef<any>;

  async ngOnInit() {
    log.i(`CRUD`, this.crud);
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
      this.setModel(this.model);
    }

    if ((!_.isUndefined(this.id))) {
      const m = await this.crud.getBy(this.id).received;
      this.setModel(m.body.json);
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
          const m = await this.crud.updateById(id, model).received;
          log.i('Model update success', m);
          resultModel = m.body.json;
          this.submit.next(model);
        } catch (e) {
          log.er('Model update error', e);
          this.submit.error(e);
        }
      } else if (this.mode === 'create') {
        try {
          const m = await this.crud.create(model).received;
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
