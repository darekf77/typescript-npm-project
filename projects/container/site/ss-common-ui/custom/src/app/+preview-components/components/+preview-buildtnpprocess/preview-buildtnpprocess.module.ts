import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { BuildTnpProcessModule, RecrusiveMenuModule } from 'components';
import { Morphi } from 'morphi/browser';
import { PreviewBuildtnpprocessComponent } from './preview-buildtnpprocess.component';
import { routes } from './preview-buildtnpprocess.routes';

import { ProjectController } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/ProjectController';
import { ProcessController } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/ProcessController';

import { PROJECT } from 'ss-common-logic/browser-for-ss-common-ui/apps/project/PROJECT';
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/apps/process/PROCESS';

const angularModules = [
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes)
];

const localModules = [
  BuildTnpProcessModule,
  RecrusiveMenuModule
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
  providers: [
    ProjectController
  ]
})
export class PreviewBuildTnpProcesssModule { }
