// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatCardModule } from '@angular/material/card';
// other
import { Morphi } from 'morphi';
// local
import { PreviewProcessLoggerComponent } from './preview-process-logger.component';
import { FormWrapperMaterialModule } from 'ss-components/components';
import { ProcessLoggerModule } from 'ss-common-logic/src/apps/process/process-logger'
import { PROCESS } from 'ss-common-logic/src/apps/process/PROCESS';
import { ProcessController } from 'ss-common-logic/src/apps/process/ProcessController';


const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [ProcessController],
  entities: [PROCESS]
});

const angularModules = [
  CommonModule,
  ReactiveFormsModule,
  RouterModule.forChild([
    {
      path: '',
      pathMatch: 'prefix',
      component: PreviewProcessLoggerComponent,
    }
  ])
];

const materialModules = [
  MatCardModule
];

const otherModules = [
  ProcessLoggerModule,
  FormWrapperMaterialModule
];

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    ...otherModules
  ],
  declarations: [PreviewProcessLoggerComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewProcessLoggerModule {

}
