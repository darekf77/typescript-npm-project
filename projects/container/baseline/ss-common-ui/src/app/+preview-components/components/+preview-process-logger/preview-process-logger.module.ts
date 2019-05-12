// angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatCardModule } from '@angular/material/card';
// other
import { Morphi } from 'morphi/browser';
// local
import { PreviewProcessLoggerComponent } from './preview-process-logger.component';
import { FormWrapperMaterialModule } from 'ss-common-ui/components/formly';
import { ProcessLoggerModule } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/process-logger'
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/PROCESS';
import { ProcessController } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/ProcessController';


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
