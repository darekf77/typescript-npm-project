import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { BuildTnpProcessModule } from 'components';
import { Morphi } from 'morphi/browser';
import { PreviewBuildtnpprocessComponent } from './preview-buildtnpprocess.component';
import { routes } from './preview-buildtnpprocess.routes';
import { BuildService } from 'ss-common-logic/browser-for-ss-common-ui/services/BuildService';
// logic
import { BuildController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/BuildController';
import { BUILD } from 'ss-common-logic/browser-for-ss-common-ui/entities/BUILD';


const angularModules = [
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes)
];

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [BuildController],
  entities: [BUILD]
});

@NgModule({
  imports: [
    ...angularModules,
    BuildTnpProcessModule,
  ],
  exports: [
    PreviewBuildtnpprocessComponent
  ],
  declarations: [PreviewBuildtnpprocessComponent],
  providers: [
    BuildController,
    BuildService
  ]
})
export class PreviewBuildTnpProcesssModule { }
