// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// other
import { ProcessLoggerComponent } from './process-logger.component';

import { ButtonIconModule } from '../../base-components';


const angularModules = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
];

@NgModule({
  imports: [
    ...angularModules,
    ButtonIconModule
  ],
  entryComponents: [ProcessLoggerComponent],
  exports: [ProcessLoggerComponent],
  declarations: [ProcessLoggerComponent]
})
export class ProcessLoggerModule { }
