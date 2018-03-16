import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSidenavModule } from "@angular/material/sidenav";
// local
import { SliderVerticalComponent } from './slider-vertical.component';
import { SliderVerticalModule } from '../../../../../components/src/sliders/slider-vertical/slider-vertical.module';


const modules = [
  MatTabsModule,
  MatSidenavModule
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: SliderVerticalComponent, pathMatch: 'full' }
    ]),
    SliderVerticalModule,
    ...modules
  ],
  declarations: [SliderVerticalComponent]
})
export class SliderVerticalModulePreview { }
