import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
// material
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// formly
import { FormlyModule } from '@ngx-formly/core';
// third part
import { init, AngularProviders } from 'morphi/browser';
// local
import { PreviewMultimediaWrapperComponent } from './preview-multimedia-wrapper.component';
import { routes } from './preview-multimedia-wrapper.routes';
import { MultimediaController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/core/MultimediaController';
import { AuthController } from 'ss-common-logic/browser-for-ss-common-ui/controllers/core/AuthController';
import { MULTIMEDIA } from 'ss-common-logic/browser-for-ss-common-ui/entities';
import { MultimediaWrapperModule, MultimediaWrapperComponent } from 'components';


const angularModules = [
  CommonModule,
  ReactiveFormsModule,
  RouterModule.forChild(routes)
];

const materialModules = [
  MatCardModule,
  MatButtonToggleModule,
  MatSlideToggleModule
];

const formlyModules = [
  FormlyModule.forRoot({
    types: [
      { name: 'multimediawrapper', component: MultimediaWrapperComponent }
    ],
    validationMessages: [
      { name: 'required', message: 'This field is required' },
    ],
  }),
];

const otherModules = [
  MultimediaWrapperModule,
];

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

init({
  host,
  controllers: [MultimediaController, AuthController],
  entities: [MULTIMEDIA]
})
  .angularProviders();

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    ...formlyModules,
    ...otherModules
  ],
  declarations: [PreviewMultimediaWrapperComponent],
  providers: [
    AngularProviders
  ]
})
export class PreviewMultimediaWrapperModule { }
