//#region angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
//#endregion
//#region material
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
//#endregion
//#region local
import { ProcessLoggerComponent } from './process-logger.component';
import { ProcessConsoleInfoModule } from './process-console-info/process-console-info.module';
import { ProcessInfoMessageComponent } from './process-info-message/process-info-message.component';
//#endregion
//#region isomorphic
import { ButtonIconModule } from 'tnp-ui';
import {  DraggablePopupModule } from 'tnp-ui';
import { ResizeService } from 'tnp-helpers';
import { CLASS } from 'typescript-class-helpers';
//#endregion
import { MomentModule } from 'ngx-moment';
import { FormlyModule } from '@ngx-formly/core';
import { LongPress } from 'tnp-helpers';

const angularModules = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
];

const materialModules = [
  MatExpansionModule,
  MatTabsModule,
  MatIconModule,
  MatListModule,
  MatProgressSpinnerModule
];

const otherModules = [
  MomentModule
];

const localModules = [
  DraggablePopupModule,
  ButtonIconModule,
  ProcessConsoleInfoModule,
  FormlyModule.forRoot({
    types: [
      { name: CLASS.getName(ProcessLoggerComponent), component: ProcessLoggerComponent },
    ],
    validationMessages: [
      { name: 'required', message: 'This field is required' },
    ],
  }),
];

const localComponents = [
  ProcessInfoMessageComponent,
  ProcessLoggerComponent
];

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    ...otherModules,
    ...localModules,
  ],
  entryComponents: [ProcessLoggerComponent],
  exports: [ProcessLoggerComponent, MomentModule],
  declarations: [
    LongPress,
    ...localComponents
  ],
  providers: [ResizeService]
})
export class ProcessLoggerModule { }
