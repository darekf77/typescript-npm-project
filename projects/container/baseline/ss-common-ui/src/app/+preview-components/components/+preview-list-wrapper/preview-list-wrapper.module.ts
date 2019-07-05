import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// material
import { MatCardModule } from '@angular/material/card';
// local
import { PreviewListWrapperComponent } from './preview-list-wrapper.component';
import { routes } from './preview-list-wrapper.routes';
import { FormWrapperMaterialModule } from 'ss-components/components';
import {
  ListWrapperModule
} from 'ss-components/components';

// third part
import { ExamplesController } from 'ss-common-logic/src/apps/example/ExamplesController';
import { Morphi } from 'morphi';
import { EXAMPLE } from 'ss-common-logic/src/apps/example/EXAMPLE';


const materialModules = [
  MatCardModule
];

const host = ENV.workspace.projects.find(({ name }) => name === 'ss-common-logic').host;

console.log('INITM MORPHI MODULE');
Morphi.init({
  host,
  controllers: [ExamplesController],
  entities: [EXAMPLE]
});

@NgModule({
  imports: [
    CommonModule,
    ListWrapperModule,
    ...materialModules,
    FormWrapperMaterialModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PreviewListWrapperComponent],
  providers: [
    Morphi.Providers
  ]
})
export class PreviewListWrapperModule { }
