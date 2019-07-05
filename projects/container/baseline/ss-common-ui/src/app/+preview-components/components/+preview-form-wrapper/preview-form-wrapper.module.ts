import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// material
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
// formly
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule, } from '@ngx-formly/material';
// local
import { PreviewFormWrapperComponent } from './preview-form-wrapper.component';
import { routes } from './preview-form-wrapper.routes';
import {
  ListWrapperModule, FormWrapperMaterialModule,
  EditorWrapperModule, FormlySwitchModule
} from 'ss-components/components';

import { ProcessLoggerModule } from 'ss-common-logic/src/apps/process/process-logger'
import { MultimediaWrapperModule } from 'ss-common-logic/src/apps/multimedia/multimedia-components'
// third part
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';
import { Morphi } from 'morphi';
import { EXAMPLE } from 'ss-common-logic/src/apps/example/EXAMPLE';
import { ProcessController } from 'ss-common-logic/src/apps/process/ProcessController';
import { PROCESS } from 'ss-common-logic/src/apps/process/PROCESS';


const angularModules = [
  ReactiveFormsModule,
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes)
];


const materialModules = [
  MatCardModule,
  MatButtonToggleModule
];

const commonUiModules = [
  ListWrapperModule,
  FormlySwitchModule,
  EditorWrapperModule,
  ProcessLoggerModule,
  FormWrapperMaterialModule,
  MultimediaWrapperModule,
]

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [ExamplesController, ProcessController],
  entities: [EXAMPLE, PROCESS]
});


@NgModule({
  imports: [
    ...angularModules,
    ...commonUiModules,
    ...materialModules,
  ],
  declarations: [PreviewFormWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewFormWrapperModule { }
