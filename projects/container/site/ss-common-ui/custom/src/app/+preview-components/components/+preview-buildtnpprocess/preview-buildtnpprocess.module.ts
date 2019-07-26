import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { RecrusiveMenuModule } from 'baseline/ss-components/components/recrusive-menu';
import { Morphi } from 'morphi';
import { PreviewBuildtnpprocessComponent } from './preview-buildtnpprocess.component';
import { routes } from './preview-buildtnpprocess.routes';

import { PROJECT } from 'ss-common-logic/src/apps/project/PROJECT';
import { ProjectController } from 'ss-common-logic/src/apps/project/ProjectController';
import { BuildTnpProcessModule } from 'ss-common-logic/src/apps/project/project-ui';
import { PROCESS } from 'ss-common-logic/src/apps/process/PROCESS';
import { ProcessController } from 'ss-common-logic/src/apps/process/ProcessController';
import { ErrorsNotyficationsModule } from 'baseline/ss-components/components/errors-notyfications/errors-notyfications.module';

const angularModules = [
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes)
];

const localModules = [
  BuildTnpProcessModule,
  RecrusiveMenuModule,
  ErrorsNotyficationsModule
]

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [ProjectController, ProcessController],
  entities: [PROJECT, PROCESS]
});

@NgModule({
  imports: [
    ...angularModules,
    ...localModules
  ],
  exports: [
    PreviewBuildtnpprocessComponent
  ],
  declarations: [PreviewBuildtnpprocessComponent],
  providers: []
})
export class PreviewBuildTnpProcesssModule { }
