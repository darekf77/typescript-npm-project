import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { CategoryEditorComponent } from './category-editor.component';

import { MatListModule } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";

const materialModules = [
  MatListModule,
  MatTabsModule,
  MatIconModule,
  MatInputModule,
  MatCardModule,
  MatButtonModule
]

// formly
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from "@ngx-formly/material";


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ...materialModules,
    ReactiveFormsModule,
    FormlyMaterialModule,
    FormlyModule.forRoot({
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
    }),
  ],
  exports: [
    CategoryEditorComponent
  ],
  declarations: [CategoryEditorComponent],
  providers: []
})
export class CategoryEditorModule { }
