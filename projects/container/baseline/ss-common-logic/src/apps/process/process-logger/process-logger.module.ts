// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// material
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// other
import { MomentModule } from 'ngx-moment';
// local
import { ProcessLoggerComponent } from './process-logger.component';
import { ProcessConsoleInfoModule } from './process-console-info/process-console-info.module';
import { ProcessInfoMessageComponent } from './process-info-message/process-info-message.component';

import { ButtonIconModule } from 'ss-common-ui/module';
import { ResizeService } from 'ss-common-ui/module';
import { MoveablePopupModule } from 'ss-common-ui/module';



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
  // StandalonePopupModule,
  MoveablePopupModule,
  ProcessConsoleInfoModule,
  ButtonIconModule,
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
    ...localComponents
  ],
  providers: [ResizeService]
})
export class ProcessLoggerModule { }
