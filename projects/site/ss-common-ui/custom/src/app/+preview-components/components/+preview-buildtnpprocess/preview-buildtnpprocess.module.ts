import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreviewBuildtnpprocessComponent } from './preview-buildtnpprocess.component';
import { routes } from './preview-buildtnpprocess.routes';
import { RouterModule } from '@angular/router';
import { BuildTnpProcessModule } from 'components';
import { BuildService } from 'ss-common-logic/browser-for-ss-common-ui/services/BuildService';
import { BuildController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/BuildController';


const angularModules = [
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes)
];

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
