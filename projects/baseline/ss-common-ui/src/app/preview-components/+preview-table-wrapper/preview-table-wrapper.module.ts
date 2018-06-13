import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreviewTableWrapperComponent } from './preview-table-wrapper.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'prefix',
        component: PreviewTableWrapperComponent,
      }
    ])
  ],
  declarations: [PreviewTableWrapperComponent]
})
export class PreviewTableWrapperModule { }
