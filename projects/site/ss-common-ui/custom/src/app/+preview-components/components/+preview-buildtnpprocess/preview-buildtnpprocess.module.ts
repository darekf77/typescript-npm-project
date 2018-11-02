import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreviewBuildtnpprocessComponent } from './preview-buildtnpprocess.component';
import { routes } from './preview-buildtnpprocess.routes';
import { RouterModule } from '@angular/router';
import { BuildTnpProcessModule } from 'components';


import { NgxsModule, Select, Selector } from '@ngxs/store'
import { Action, State, StateContext } from '@ngxs/store'
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin'
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin'
import { TNP_PROJECT_STATE } from './ngxs-test';




const angularModules = [
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes),
  NgxsModule.forRoot([
    TNP_PROJECT_STATE
  ]),
  NgxsReduxDevtoolsPluginModule.forRoot(),
  NgxsLoggerPluginModule.forRoot()
];

@NgModule({
  imports: [
    ...angularModules,
    BuildTnpProcessModule,
  ],
  exports: [
    PreviewBuildtnpprocessComponent
  ],
  declarations: [PreviewBuildtnpprocessComponent]
})
export class PreviewBuildTnpProcesssModule { }
