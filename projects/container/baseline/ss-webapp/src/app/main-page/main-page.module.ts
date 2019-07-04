import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMainPageComponent } from './main-page.component';
import { FormsModule } from '@angular/forms';
// third paret
import {
  SliderVerticalModule
} from 'ss-layouts/components';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';
import { LoginModule } from '../login/login.module';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: AppMainPageComponent
  },
];

const modules = [
  SliderVerticalModule,
  LoginModule
  // CommonUIModule
]

const components = [
  AppMainPageComponent
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    ModalModule.forRoot(),
    ...modules
  ],
  exports: [
    ModalModule,
    ...modules
  ],
  declarations: [
    ...components
  ]
})
export class AppMainPageModule { }
