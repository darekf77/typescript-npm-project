import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMainPageComponent } from './main-page.component';
import { FormsModule } from '@angular/forms';
// third paret
import { SliderVerticalModule } from "ss-common-ui/module/sliders/slider-vertical";
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from '../login/login.component';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: AppMainPageComponent
  },
];

const modules = [
  SliderVerticalModule
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    modules
  ],
  declarations: [AppMainPageComponent, LoginComponent]
})
export class AppMainPageModule { }
