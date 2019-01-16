import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMainPageComponent } from './main-page.component';
import { FormsModule } from '@angular/forms';

import { Routes, RouterModule } from '@angular/router';
import { LoginModule } from '../login/login.module';

export const routes: Routes = [
  {
      path: '',
      pathMatch: 'prefix',
      component: AppMainPageComponent
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    LoginModule,
    RouterModule.forChild(routes)
  ],
  declarations: [AppMainPageComponent]
})
export class AppMainPageModule { }
