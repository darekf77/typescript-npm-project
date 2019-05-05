import { Subscription } from 'rxjs/Subscription';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';

import {
  Component, OnInit, Input, Output, AfterViewInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup
} from '@angular/forms'
import { Log, Level } from 'morphi/log';
import { DualComponentController } from './dual-component-ctrl';

const log = Log.create('base formly component')

@Component({
  selector: 'app-base-formly-component-meta',
  template: ``
})
export abstract class BaseFormlyComponent<T = any> extends FieldType
  implements OnInit, Partial<DualComponentController<T>> {

  ctrl: DualComponentController;

  @Input() disabled: boolean;
  @Input() required: boolean;
  @Input() label: string;
  @Input() placeholder: string;
  @Input() defaultValue: T;
  @Input() model: any;
  @Input() key: string;
  @Input() formControl: FormControl;
  protected handlers: Subscription[] = [];

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
    this.handlers.length = 0;
  }

  ngOnInit() {
    this.ctrl = new DualComponentController<T>(this, !!this.field);
    log.i('this.ctrl.isFormlyMode', this.ctrl.isFormlyMode)
    // if (!this.formControl) {
    //   this.formControl = new FormControl({})
    //   Object.defineProperty(this, 'field', {
    //     get: () => {
    //       return {
    //         formControl: this.formControl
    //       } as FormlyFieldConfig
    //     }
    //   })
    //   //   this.formControl = new FormControl({})
    // }
  }

}
