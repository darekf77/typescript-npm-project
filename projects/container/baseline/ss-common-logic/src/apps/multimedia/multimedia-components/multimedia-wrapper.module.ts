import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// material
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// local
import { MultimediaChooserModule } from './multimedia-chooser/multimedia-chooser.module';
import { MultimediaUploadModule } from './multimedia-upload/multimedia-upload.module';
import { MultimediaWrapperComponent } from './multimedia-wrapper.component';
import { DialogWrapperModule } from '../../dialog/dialog-wrapper';
import { FormlyModule } from '@ngx-formly/core';
import { CLASS } from 'typescript-class-helpers';

const angularModules = [
  CommonModule
];

const moduleMaterial = [
  MatTabsModule,
  MatDialogModule,
  MatButtonModule,
  MatIconModule
];

const localModules = [
  MultimediaChooserModule,
  MultimediaUploadModule,
  DialogWrapperModule
];


@NgModule({
  imports: [
    ...angularModules,
    ...moduleMaterial,
    ...localModules,
    FormlyModule.forRoot({
      types: [
        { name: 'multimediawrapper', component: MultimediaWrapperComponent },
        { name: CLASS.getName(MultimediaWrapperComponent), component: MultimediaWrapperComponent },
      ],
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
    }),
  ],
  exports: [
    MultimediaWrapperComponent
  ],
  declarations: [MultimediaWrapperComponent]
})
export class MultimediaWrapperModule { }
