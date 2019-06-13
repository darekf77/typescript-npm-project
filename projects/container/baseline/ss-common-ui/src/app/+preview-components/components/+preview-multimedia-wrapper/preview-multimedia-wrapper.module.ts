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
import { Morphi } from 'morphi/browser';
// local
import { PreviewMultimediaWrapperComponent } from './preview-multimedia-wrapper.component';
import { routes } from './preview-multimedia-wrapper.routes';
import { MultimediaController } from 'ss-common-logic/browser-for-ss-common-ui/apps/multimedia/MultimediaController';
import { AuthController } from 'ss-common-logic/browser-for-ss-common-ui/apps/auth/AuthController';
import { MULTIMEDIA } from 'ss-common-logic/browser-for-ss-common-ui/apps/multimedia/MULTIMEDIA';
// formly modules
import { MultimediaWrapperModule } from 'ss-common-logic/browser-for-ss-common-ui/apps/multimedia/multimedia-components';
import { FormWrapperMaterialModule } from 'components';


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
  MultimediaWrapperModule,
  FormWrapperMaterialModule,
];

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

Morphi.init({
  host,
  controllers: [MultimediaController, AuthController],
  entities: [MULTIMEDIA]
});

@NgModule({
  imports: [
    ...angularModules,
    ...materialModules,
    ...formlyModules
  ],
  exports: [
    ...formlyModules
  ],
  declarations: [PreviewMultimediaWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewMultimediaWrapperModule { }
