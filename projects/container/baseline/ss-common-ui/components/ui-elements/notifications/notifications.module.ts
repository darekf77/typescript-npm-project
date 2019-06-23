import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications.component';

import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationsService } from './notifications.service';

@NgModule({
  imports: [
    CommonModule,
    // BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot() // ToastrModule added
  ],
  declarations: [NotificationsComponent],
  providers: [NotificationsService]
})
export class NotificationsModule { }
