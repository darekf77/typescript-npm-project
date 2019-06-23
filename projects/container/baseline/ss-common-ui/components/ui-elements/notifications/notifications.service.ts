import { Injectable } from '@angular/core';

import { ToastrService } from 'ngx-toastr';


@Injectable()
export class NotificationsService {

  constructor(
    //#region @cutCodeIfFalse ENV.frameworks.includes('material')
    public toast: ToastrService,
    //#endregion
  ) {

  }

  success(title: string, subtitle: string) {
    return this.toast.success(title, subtitle, {
      easing: '300',
    });
  }


}
