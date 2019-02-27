import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// local
import { BuildTnpProcessModule } from 'components';
import { Morphi } from 'morphi/browser';
import { PreviewBuildtnpprocessComponent } from './preview-buildtnpprocess.component';
import { routes } from './preview-buildtnpprocess.routes';


const angularModules = [
  CommonModule,
  FormsModule,
  RouterModule.forChild(routes)
];

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [],
  entities: []
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

  ]
})
export class PreviewBuildTnpProcesssModule { }
