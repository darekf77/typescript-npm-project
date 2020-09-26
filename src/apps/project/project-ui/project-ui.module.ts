import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
// other
import { CLASS } from 'typescript-class-helpers';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
// local
import { BuildTnpProcessComponent } from './project-ui.component';
import { TnpProjectComponent } from './tnp-project/tnp-project.component';
import {
  ItemEnvironmentComponent, ItemBuildComponent,
  ItemServeComponent, ItemTestComponent
} from './tnp-project/items';
import { FormlyModule } from '@ngx-formly/core';
import { ProcessLoggerModule } from '../../process/process-logger';
import { ListWrapperModule } from 'tnp-ui';

const angularModules = [
  CommonModule,
  ReactiveFormsModule,
];


const materialModules = [
  MatButtonModule,
  MatInputModule,
  MatIconModule,
  MatDialogModule,
  MatSlideToggleModule,
  MatProgressBarModule,
  MatStepperModule,
  MatFormFieldModule,
  MatExpansionModule,
  MatCardModule,
  MatRadioModule
];
const stepperItemsComponents = [
  ItemEnvironmentComponent,
  ItemBuildComponent,
  ItemServeComponent,
  ItemTestComponent
];

const componentsLocal = [
  ...stepperItemsComponents,
  TnpProjectComponent,
  BuildTnpProcessComponent,
];

const baselineModules = [
  ProcessLoggerModule,
  ListWrapperModule,
]

@NgModule({
  imports: [
    FormlyModule.forRoot({
      types: [
        { name: 'project', component: BuildTnpProcessComponent },
        { name: CLASS.getName(BuildTnpProcessComponent), component: BuildTnpProcessComponent },
      ],
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
    }),
    ...angularModules,
    ...materialModules,
    ...baselineModules
  ],
  exports: [...componentsLocal],
  declarations: [...componentsLocal],
  providers: []
})
export class BuildTnpProcessModule { }
