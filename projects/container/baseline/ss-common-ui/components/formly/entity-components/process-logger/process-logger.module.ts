// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// material
import { MatExpansionModule } from '@angular/material/expansion';
// local
import { ProcessLoggerComponent } from './process-logger.component';
import { ButtonIconModule } from '../../base-components';

import {
  StandalonePopupModule
} from '../../../ui-elements/standalone-popup';


const angularModules = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
];

const materialModules = [
  MatExpansionModule
];

const localModules = [
  StandalonePopupModule,
  ButtonIconModule
];

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    ...localModules
  ],
  entryComponents: [ProcessLoggerComponent],
  exports: [ProcessLoggerComponent],
  declarations: [ProcessLoggerComponent]
})
export class ProcessLoggerModule { }
