// angular
import {
  Component, OnInit, Input, Output, AfterViewInit,
} from '@angular/core';
import * as _ from 'lodash';
import { Morphi } from 'morphi/browser';
import { Log, Level } from 'morphi/browser/log';
import { Helpers } from 'morphi/browser/helpers';
import { BaseFormlyComponent } from 'ss-common-ui/components/helpers';
import { CLASS } from 'typescript-class-helpers/browser';


const log = Log.create('select wrapper');

export interface CRUDSelectWrapperOption {
  value: string;
  label: string;
}

@CLASS.NAME('SelectWrapperComponent')
@Component({
  selector: 'app-select-wrapper',
  templateUrl: './select-wrapper.component.html',
  styleUrls: ['./select-wrapper.component.scss']
})
export class SelectWrapperComponent extends BaseFormlyComponent implements OnInit, AfterViewInit {

  isLoading = false;

  @Input() crud: Morphi.CRUD.Base<any>;

  @Input() selectOptions: CRUDSelectWrapperOption[] = [];


  @Input() data = [
    { value: 'dupa', label: 'Onet' },
    { value: 2, label: 'Google' }
  ];

  @Input() label = 'default label'

  @Input() valueProp = 'id';
  @Input() nameProp = 'name';

  // fields: FormlyFieldConfig[] = [];

  // @Input() lable: string;

  async ngOnInit() {
    super.ngOnInit()

    if (!this.crud && _.isFunction(_.get(this.field, 'templateOptions.crud'))) {
      this.crud = this.field.templateOptions.crud;
    }

    if (_.isFunction(this.crud)) {
      this.isLoading = true;
      log.i('this.crud.entity', Helpers.Class.describeProperites(this.crud.entity));
      try {
        const rows = await this.crud.getAll().received.observable.take(1).toPromise();
        this.initOptions(rows.body.json);
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    } else {
      this.initOptions(this.data);
    }

  }

  initOptions(rows: any[]) {
    this.selectOptions = rows.map(r => {
      if (!this.crud) {
        return r;
      }
      return { value: r[this.valueProp], label: r[this.nameProp] };
    });
  }

  ngAfterViewInit() {
    // log.i('this', this.field);
  }

}
