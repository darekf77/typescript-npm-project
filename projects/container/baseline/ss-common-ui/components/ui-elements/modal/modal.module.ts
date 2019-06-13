import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from './modal.component';
import { ModalService } from './modal.service';


//#region @cutCodeIfFalse ENV.frameworks.includes('material')
import { MatDialogModule } from '@angular/material/dialog';
//#endregion

const material = [
  MatDialogModule
]

@NgModule({
  imports: [
    CommonModule,
    //#region @cutCodeIfFalse ENV.frameworks.includes('material')
    ...material
    //#endregion
  ],
  declarations: [ModalComponent],
  providers: [ModalService]
})
export class ModalModule { }
