import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  ListWrapperModule, FormWrapperMaterialModule, ProcessLoggerModule
} from 'components';
// third part
import { ExamplesController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/ExamplesController';
import { Morphi } from 'morphi/browser';
import { EXAMPLE } from 'ss-common-logic/browser-for-ss-common-ui/entities/EXAMPLE';
import { ProcessController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/core/ProcessController';
import { PROCESS } from 'ss-common-logic/browser-for-ss-common-ui/entities/core/PROCESS';



const materialModules = [
  MatCardModule,
  MatButtonToggleModule
];



const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [ExamplesController, ProcessController],
  entities: [EXAMPLE, PROCESS]
});

@NgModule({
  imports: [
    CommonModule,
    ListWrapperModule,
    ...materialModules,
    RouterModule.forChild(routes),
    ProcessLoggerModule,
    FormWrapperMaterialModule,
    FormlyModule.forChild({
      types: [
        ...Morphi.Formly.getAllRegisterdTypes()
      ]
    })
  ],
  declarations: [PreviewFormWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewFormWrapperModule { }
